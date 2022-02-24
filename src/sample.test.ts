import path from "path";
import { Environment as EnvironmentClass, Config } from "./index";
import http, { IncomingMessage, ServerResponse } from "http";
const secretFile = require("../secret.key") || {};
class Environment extends EnvironmentClass {
    onReady() {
        this.set(AppConfig);
        return this;
    }
    get App(): AppConfig {
        return this.get("App");
    }
}
class AppConfig extends Config {
    PORT = Number(this.getEnv<number>("PORT"));
}
const environment = new Environment({
    name: "",
    debug: true,
    env: "development",
    file: {
        path: path.resolve(__dirname, "../.env"),
        ...secretFile.file,
    },
    basePath: path.resolve(__dirname, "../"),
    firestore: {
        serviceAccount: path.resolve(__dirname, "../firebase-config.json"),
        ...secretFile.firebase,
    },
    aws: secretFile.aws,
    http: {
        url: "https://raw.githubusercontent.com/leantony/ecommerce/728d664fb1e8613ad18d243cc9357ffc6a0882b4/.env.sample"
    }
});
const server = http.createServer({}, (req: IncomingMessage, res: ServerResponse) => {
    req.pipe(res);
});
environment.log("SecretFile", secretFile);
environment.once("ready", () => {
    environment.onReady();
    server.listen(environment.App.PORT, () => {
        environment.logger.info(`App started on ${environment.App.PORT}`);
    });
});