import { SentryConfig } from "./sentry-config.interface";
import * as AWS from "aws-sdk";
import { Bucket } from '@google-cloud/storage';
interface AwsConfig {
   instance?: AWS.S3;
   accessKeyId?: string,
   secretAccessKey?: string,
   region?: string,
   params: {
      Bucket: string,
      Key: string,
   },
   override?: boolean;
}
interface FirestoreConfig {
   instance?: Bucket;
   serviceAccount?: string,
   region?: string,
   params: {
      Bucket: string,
      Key: string,
   },
   override?: boolean;
}
interface HttpConfig {
   url: string,
   auth?: {
      username: string,
      password: string,
   },
   override?: boolean;
}
interface FileConfig {
   path: string;
   override?: boolean;
}
export interface EnvironmentConfig {
   name: string;
   env: "staging" | "sandbox" | "test" | "development" | "production";
   debug: boolean;
   basePath: string;
   logPath?: string;
   logToFile?: boolean;
   sentry?: SentryConfig;
   aws?: AwsConfig;
   firestore?: FirestoreConfig;
   http?: HttpConfig;
   file?: FileConfig;
}