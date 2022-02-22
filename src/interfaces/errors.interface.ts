export interface ErrorHandlerFormat {
    envelope?: boolean;
    envelopeKey?: string;
}
export interface ErrorHandlerOptions {
    format?: ErrorHandlerFormat;
}
export type SafePropsError = "code"|  "message"| "info";
export type SafePropsErrors =  Array<SafePropsError>;
export type SafePropsErrorsExtended<T extends any> = Array<SafePropsError | T>;