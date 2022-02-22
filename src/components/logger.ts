import  utils from "shortId";
import cls_hooked from "cls-hooked";
import path from "path";
import winston from "winston";
import winston_daily_rotate_file from "winston-daily-rotate-file";
export const NAMESPACE = "log";
const logNamespace = cls_hooked.createNamespace(NAMESPACE);
export const getLogNamespace = () => {
    return cls_hooked.getNamespace(NAMESPACE);
};
export const UppercaseLevel = winston.format((info) => {
    info.level = info.level.toLocaleUpperCase();
    return info;
});
export const LogContextId = winston.format((info) => {
    const namespace = cls_hooked.getNamespace(NAMESPACE);
    if (namespace) {
        const contextId = namespace.get("ContextId");
        if (contextId) {
            info.ContextId = contextId;
        }
    }
    return info;
});
export const createContextId = (cb:(error?:Error|null,contextId?:boolean|string)=>void) => {
    if (!logNamespace) {
        return cb(null, false);
    }
    const contextId = utils();
    logNamespace.run(() => {
        logNamespace.set("ContextId", contextId);
        cb(null, contextId);
    });
};
const TRANSPORTS:any = {
    console: new winston.transports.Console({
        level: "debug",
        handleExceptions: true,
        format: winston.format.combine(winston.format.errors({ stack: true }), winston.format.timestamp(), UppercaseLevel(), LogContextId(), winston.format.colorize(), winston.format.simple()),
        silent: false,
    }),
};
export const Logger = winston.createLogger({
    transports: Object.values(TRANSPORTS),
});
// export default Logger;
export const LogStream = {
    write: (message:Buffer) => {
        Logger.info(message);
    },
};
export const addFileLogging = (logDir:string) => {
    TRANSPORTS.file = new winston_daily_rotate_file({
        level: "debug",
        handleExceptions: true,
        format: winston.format.combine(winston.format.errors({ stack: true }), winston.format.timestamp(), UppercaseLevel(), LogContextId(), winston.format.simple()),
        silent: false,
        filename: path.resolve(logDir, "%DATE%.log"),
    });
    Logger.add(TRANSPORTS.file);
};