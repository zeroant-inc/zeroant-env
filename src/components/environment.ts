import { config as loadOverrides, parse as parseEnv } from "dotenv";
import fs from "fs";
import path from "path";
import { addFileLogging, Logger } from "../components/logger";
import * as Sentry from "@sentry/node";
import { ErrorHandler, AppError, ServerError } from "../components/errors";
import { EnvironmentConfig } from "../interfaces/environment-config.interface";
import { Config, ConfigConstructable } from "./config";
import * as AWS from "aws-sdk";
import admin from "firebase-admin";
import { Bucket } from "@google-cloud/storage";
import { EventEmitter } from "stream";
import axios from "axios";
export class Environment extends EventEmitter {
    protected _config: EnvironmentConfig;
    protected _appEnv: Record<string, string | number> = {};
    protected _ErrorHandler = new ErrorHandler();
    protected _registry = new Map<string, Config>();
    constructor(config: EnvironmentConfig) {
        super({ captureRejections: false });
        this._config = config;
        this.log("EnvironmentConfig", this._config);
        this.init();
    }
    get ENV() { return this._config.env };
    get PROD() {
        return this.ENV === "production";
    }
    protected get processEnv(): Record<string, string | undefined> {
        return process.env;
    }
    get getLogPath() {
        if (!this._config.logPath) return null;
        return path.resolve(this._config.logPath, path.parse(process.env.pm_exec_path || process.argv[1]).name);
    }
    get getBasePath() {
        return path.resolve(this._config.basePath);
    }
    get logToFile() {
        return this._config.logToFile ?? false;
    }
    getEnv<T = string>(key: string, onNotExist: any = undefined) {
        this._appEnv[key] = onNotExist || undefined;
        return (this.processEnv[key] || onNotExist) as T;
    }
    protected get getAppEnv() {
        return this._appEnv;
    }
    discribe(title: string, fn: () => void) {
        const line = "--------------------";
        this.log("|" + line, "(START -> " + title + "  )", line + "|");
        fn();
        this.log("|" + line, "(END ->   " + title + "  )", line + "|");
    }
    log(...arg: any[]) {
        if (this._config.debug) console.log("[DEBUG]", ...arg);
    }
    assert(value: any, message?: string | undefined, ...arg: any[]) {
        if (this._config.debug) console.assert(value, "[DEBUG] " + message, ...arg);
    }
    protected async init() {
        await new Promise<boolean>((resolve) => resolve(this.emit("init")));
        if (this._config.sentry) await new Promise<any>((resolve) => resolve(this.initSentry()));
        if (this._config.firestore) await this.initFirestoreEnvironmentOveride();
        if (this._config.aws) await this.initAwsEnvironmentOveride();
        if (this._config.http) await this.initHttpEnvironmentOverride();
        if (this._config.file) await new Promise<any>((resolve) => resolve(this.initFileEnvironmentOverride()));
        await new Promise<any>((resolve) => resolve(this.initLogHandler()));
        await new Promise<boolean>((resolve) => resolve(this.emit("ready")));
    }
    initFileEnvironmentOverride() {
        if (!fs.existsSync(this._config.file!.path)) return;
        return loadOverrides({
            path: this._config.file!.path,
            debug: this._config.debug,
            override: this._config.file!.override
        });
    }
    async initAwsEnvironmentOveride() {
        const config = this._config.aws!;
        const instance = config.instance ? config.instance : new AWS.S3({
            apiVersion: "2006-03-01",
            ...config,
        });
        const getParams = {
            Bucket: config.params.Bucket,
            Key: config.params.Key,
        };
        try {
            const env = await new Promise<Buffer>((resolve) => {
                instance.getObject(getParams, function (err, data) {
                    if (err || !data.Body) {
                        return resolve(Buffer.from(""));
                    }
                    resolve(Buffer.from(data.Body as Buffer));
                });
            });
            this.loadEnv(env.toString("utf-8"), config.override);
        } catch (error) {
            this.log("InitAwsEnvironmentOveride Error", (error as any).message)
        }
    }
    async initFirestoreEnvironmentOveride() {
        const config = this._config.firestore!;
        const instance: Bucket = config.instance ? config.instance : admin.initializeApp({
            credential: admin.credential.cert(config.serviceAccount!),
            storageBucket: config.params.Bucket,
        }, 'environment-app').storage().bucket();
        const remoteFile = instance.file(config.params.Key);
        try {
            const env = (await remoteFile.download({ decompress: true }))[0];
            this.loadEnv(env.toString("utf-8"), config.override);
        } catch (error) {
            this.log("InitFirestoreEnvironmentOveride Error", (error as any).message);
        }
    }
    async initHttpEnvironmentOverride() {
        try {
            const result = await axios.get(this._config.http!.url, {
                auth: this._config.http?.auth
            })
            this.loadEnv(result.data.toString("utf-8"), this._config.http!.override);
        } catch (error) {
            this.log("InitHttpEnvironmentOverride Error", (error as any).message);
        }
    }
    protected initSentry() {
        Sentry.init(this._config.sentry);
    }
    protected loadEnv(file: string, override = true) {
        this.log("Environment to be parse", file);
        this.log("Environment parse response", this.loadToProcessEnv(parseEnv(file), override));
    }
    protected loadToProcessEnv(o: Object, override = true) {
        Object.entries(o).forEach(([k, v]) => {
            if (!override && process.env[k] !== undefined) {
                this.log(`"${k}" is already defined in \`process.env\` and was NOT overwritten`);
                return;
            }
            if (process.env[k] !== undefined) {
                this.log(`"${k}" is already defined in \`process.env\` and was overwritten`);
            }
            process.env[k] = v;
        });
        return o;
    }
    protected initLogHandler() {
        if (this.logToFile && this.getLogPath) {
            addFileLogging(this.getLogPath);
        }
        this.ErrorHandler.on("handle", (error: Error) => {
            if (this._config.sentry) {
                Sentry.captureException(error);
            }
            Logger.error("Bubbled Error: ", error instanceof AppError && (error as AppError).inner ? (error as AppError).inner : error);
        });
    }
    get ErrorHandler() {
        return this._ErrorHandler;
    }
    protected registerConfig(key: string | ConfigConstructable, value?: ConfigConstructable) {
        let config;
        if (typeof key !== "string") {
            config = new key(this);
            key = key.name.replace(new RegExp("(Config|_config|-config)$"), "");
        } else if (typeof key === "string" && value) {
            config = new value(this);
        } else {
            throw new ServerError("invalid environment config loaded")
        }

        if (this._registry.has(key)) throw new ServerError("duplicate environment for `" + key + "` config loaded");
        this._registry.set(key, config);
        this.emit("registry", key);
        return this;
    }
    get logger() {
        return Logger;
    }
    protected getConfig<T extends Config>(key: string): T {
        if (!this._registry.has(key)) throw new ServerError("unable to fetch unknown environment for `" + key + "` config");
        return this._registry.get(key)! as T;
    }
    get = <T extends Config>(key: string | ((new ($this: Environment) => T))): T => {
        if (typeof key !== "string") {
            return this.getConfig<T>(key.name.replace(new RegExp("(Config|_config|-config)$"), "")) as T;
        }

        return this.getConfig<T>(key);
    };
    set = (key: string | ConfigConstructable, value?: ConfigConstructable) => {
        return this.registerConfig(key, value);
    };
}

export default Environment;
