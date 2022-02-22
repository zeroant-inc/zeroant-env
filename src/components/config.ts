import {Environment} from "../index";
export interface ConfigConstructable {
    new(env: Environment): Config
}
export abstract class Config{
    env:Environment;
    [x: string]: any;
    constructor($this:Environment){
        this.env=$this;
    };
    protected getEnv<T = string>(key: string, onNotExist: any = undefined) {
        return this.env.getEnv<T>(key,onNotExist);
    }
}