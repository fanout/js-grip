export interface IGripConfigBase {
    control_uri: string;
    control_iss?: string;
    key?: string | Uint8Array;
    verify_iss?: string;
    verify_key?: string | Uint8Array;
}
