# zeroant

THE JS Environment For You

# sample

<pre>
   import path from "path";
import { Environment , Config} from "./index";

const environment = new Environment({
    name: "",
    debug: true,
    env: "development",
    overridePath:path.resolve(__dirname,"../.env"),
    basePath: path.resolve(__dirname,"../"),  
});
class AppConfig extends Config{
    SMS_PORT=3000;
}
environment.registerConfig(AppConfig);
environment.discribe("App Testing",()=>{
    environment.log(`environment.App.SMS_PORT`,environment.config.App?.SMS_PORT);
    environment.log(`process.env.SMS_PORT`,Number(process.env.SMS_PORT));
    environment.log("testing environment.App.SMS_PORT === Number(process.env.SMS_PORT) It should return true")
    environment.assert(environment.config.get<AppConfig>("App").SMS_PORT === Number(process.env.SMS_PORT), `environment.App.SMS_PORT should return ${Number(process.env.SMS_PORT)}`);    
})
environment.discribe("Auth Testing",()=>{
    environment.log(`environment.Auth.AUTH_FILE`,`${environment.config.Auth?.AUTH_FILE}`);
    environment.log(`testing environment.Auth.AUTH_FILE!= null It should return false`);
    environment.assert(environment.config.Auth?.AUTH_FILE==null, "environment.Auth.AUTH_FILE should be different from null");
});
</pre>

# Using event.con and event.end

<pre>
   import path from "path";
import { Environment , Config} from "./index";

const environment = new Environment({
    name: "",
    debug: true,
    env: "development",
    overridePath:path.resolve(__dirname,"../.env"),
    basePath: path.resolve(__dirname,"../"),  
});
class AppConfig extends Config{
    SMS_PORT=3000;
}
environment.registerConfig(AppConfig);
environment.discribe("App Testing",()=>{
    environment.log(`environment.App.SMS_PORT`,environment.config.App?.SMS_PORT);
    environment.log(`process.env.SMS_PORT`,Number(process.env.SMS_PORT));
    environment.log("testing environment.App.SMS_PORT === Number(process.env.SMS_PORT) It should return true")
    environment.assert(environment.config.get<AppConfig>("App").SMS_PORT === Number(process.env.SMS_PORT), `environment.App.SMS_PORT should return ${Number(process.env.SMS_PORT)}`);    
})
environment.discribe("Auth Testing",()=>{
    environment.log(`environment.Auth.AUTH_FILE`,`${environment.config.Auth?.AUTH_FILE}`);
    environment.log(`testing environment.Auth.AUTH_FILE!= null It should return false`);
    environment.assert(environment.config.Auth?.AUTH_FILE==null, "environment.Auth.AUTH_FILE should be different from null");
});
</pre>
