import {EventEmitter} from "events";
import {  SafePropsErrorsExtended, SafePropsErrors } from "../interfaces/errors.interface";
import { ErrorHandlerOptions } from "../interfaces/errors.interface";
export abstract class  AppError extends Error {
    static LOGGABLE_DEFAULT: boolean =  true;
    static REPORTABLE_DEFAULT: boolean  = true;
    abstract httpCode: number;
    abstract code: string | number;
    message!: string;
    loggable:boolean;
    reportable: boolean;
    info: any;
    inner!: Error;
    protected context: any;
    constructor(message:string) {
        super(message);
        // restore prototype chain
        this.name = this.constructor.name;
        // Object.setPrototypeOf(this, new.target.prototype);
        this.loggable = AppError.LOGGABLE_DEFAULT;
        this.reportable = AppError.REPORTABLE_DEFAULT;
        if (message) {
            this.message = message;
        }
    }
    setCode(code:number) {
        this.code = code;
        return this;
    }
    setInfo(info:any) {
        this.info = info;
        return this;
    }
    setContext(context:any) {
        this.context = context;
        return this;
    }
    setInner(error:any) {
        this.inner = error;
        return this;
    }
    setReportable(reportable:boolean) {
        this.reportable = reportable;
        return this;
    }
    setLoggable(loggable:boolean) {
        this.loggable = loggable;
        return this;
    }
    protected safeProps():SafePropsErrors|SafePropsErrorsExtended<any> {
        return ["code", "message", "info"];
    }
    format(withUnsafe = false) {
        if (withUnsafe) {
            return this;
        }
        return (this.safeProps() as SafePropsErrors).reduce((props, value) => {
            props[value] = this[value];
            return props;
        }, {} as any);
    }
}
export class BadRequestError extends AppError {
    message: string;
    httpCode: number;
    code: string;
    constructor(message = "Bad Request.") {
        super(message);
        this.message = message;
        this.httpCode = 400;
        this.code = "BAD_REQUEST_ERROR";
    }
}
export class InvalidArgumentError extends BadRequestError {
    constructor() {
        super(...arguments);
        this.code = "INVALID_ARGUMENT_ERROR";
    }
}

export class InvalidActionError extends BadRequestError {
    constructor(message = "Requested action is invalid.") {
        super(message);
        this.message = message;
        this.code = "INVALID_ACTION_ERROR";
    }
}

export class UnauthorizedError extends AppError {
    message: string;
    httpCode: number;
    code: string;
    constructor(message = "Unauthorized.") {
        super(message);
        this.message = message;
        this.httpCode = 401;
        this.code = "UNAUTHORIZED_ERROR";
    }
}
export class ForbiddenError extends AppError {
    message: string;
    httpCode: number;
    code: string;
    constructor(message = "Forbidden.") {
        super(message);
        this.message = message;
        this.httpCode = 403;
        this.code = "FORBIDDEN_ERROR";
    }
}
export class NotFoundError extends AppError {
    message: string;
    httpCode: number;
    code: string;
    constructor(message = "Not found.") {
        super(message);
        this.message = message;
        this.httpCode = 404;
        this.code = "NOT_FOUND_ERROR";
    }
}
export class ConflictError extends AppError {
    message: string;
    httpCode: number;
    code: string;
    constructor(message = "Conflict.") {
        super(message);
        this.message = message;
        this.httpCode = 409;
        this.code = "CONFLICT_ERROR";
    }
}
export class UnprocessibleEntityError extends AppError {
    message: string;
    httpCode: number;
    code: string;
    constructor(message = "Unprocessible Entity.") {
        super(message);
        this.message = message;
        this.httpCode = 422;
        this.code = "UNPROCESSIBLE_ENTITY_ERROR";
    }
}
export class ValidationError extends UnprocessibleEntityError {
    message: string;
    fields: any;
    code: string;
    constructor(message = "One or more fields in supplied input raised validation errors.") {
        super(message);
        this.message = message;
        this.code = "INPUT_VALIDATION_ERROR";
    }
    setFields(fields:any) {
        this.fields = fields;
        return this;
    }
    safeProps():SafePropsErrorsExtended<"fields"> {
        return ["fields", ...super.safeProps()];
    }
}
export class ServiceUnavailableError extends AppError {
    message: string;
    httpCode: number;
    code: string;
    serviceName?: string;
    constructor(message = "Service Unavailable.") {
        super(message);
        this.message = message;
        this.httpCode = 503;
        this.code = "SERVICE_UNAVAILABLE_ERROR";
    }
    setServiceName(serviceName:string) {
        this.serviceName = serviceName;
        return this;
    }
}

export  class ServerError extends AppError {
    message: string;
    httpCode: number;
    code: string;
    constructor(message = "Server Error.") {
        super(message);
        this.message = message;
        this.httpCode = 500;
        this.code = "SERVER_ERROR";
    }
}

export class HttpError extends AppError {
    httpCode: number;
    code: string;
    constructor(httpCode:number, message:string) {
        super(message);
        this.httpCode = httpCode;
        this.code = "HTTP_ERROR";
    }
}

export class ErrorHandler extends EventEmitter {
    private options:ErrorHandlerOptions;
    constructor(options = {}) {
        super();
        this.options = options;
    }
    wrap(error:Error) {
        if (error instanceof AppError) {
            return error;
        }
        return new ServerError().setInner(error);
    }
    handle(error:Error) {
        const wrapped = this.wrap(error);
        this.emit("handle", wrapped);
        return wrapped;
    }
    format(error:Error, withUnsafe = false) {
        const { envelope = true, envelopeKey = "error" } = this.options.format || {};
        const wrapped = this.wrap(error);
        const formatted = { format: wrapped.format(withUnsafe), error: wrapped };
        this.emit("format", formatted, withUnsafe);
        if (!envelope) {
            return formatted.format;
        }
        return { [envelopeKey]: formatted.format };
    }
}