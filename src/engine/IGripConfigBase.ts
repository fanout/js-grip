import { Buffer } from 'node:buffer';

export interface IGripConfigBase {
    control_uri: string;
    control_iss?: string;
    key?: string | Buffer;
    verify_iss?: string;
    verify_key?: string | Buffer;
}
