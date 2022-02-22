import path from "path";
import { Environment, Config } from "./index";
const secretFile = require("../secret.key");

const environment = new Environment({
    name: "",
    debug: true,
    env: "development",
    file:{ 
      path: path.resolve(__dirname, "../.env"),
      ...secretFile.file,
    },
    basePath: path.resolve(__dirname, "../"),
    firestore: {
        serviceAccount: path.resolve(__dirname, "../firebase-config.json"),
       ...secretFile.firebase,
    },
    aws: secretFile.aws,
    http:{
        url:"https://raw.githubusercontent.com/leantony/ecommerce/728d664fb1e8613ad18d243cc9357ffc6a0882b4/.env.sample"
    }
});
class AppConfig extends Config {
    SMS_PORT = Number(this.getEnv<number>("SMS_PORT"));
}
environment.once("ready", () => {
    environment.registerConfig(AppConfig);
    environment.log("SecretFile", secretFile);
    environment.log("process.env.NAME", "=", process.env.NAME);
    environment.discribe("App Testing", () => {
        environment.log(`environment.App.SMS_PORT`, environment.config.App?.SMS_PORT);
        environment.log(`process.env.SMS_PORT`, Number(process.env.SMS_PORT));
        environment.log("testing environment.App.SMS_PORT === Number(process.env.SMS_PORT) It should return true")
        environment.assert(environment.config.get<AppConfig>("App").SMS_PORT === Number(process.env.SMS_PORT), `environment.App.SMS_PORT should return ${Number(process.env.SMS_PORT)}`);
    })
    environment.discribe("Auth Testing", () => {
        environment.log(`environment.Auth.AUTH_FILE`, `${environment.config.Auth?.AUTH_FILE}`);
        environment.log(`testing environment.Auth.AUTH_FILE!= null It should return false`);
        environment.assert(environment.config.Auth?.AUTH_FILE == null, "environment.Auth.AUTH_FILE should be different from null");
    });
});
