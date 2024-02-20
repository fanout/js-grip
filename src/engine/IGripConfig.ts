export interface IGripConfig {
  control_uri: string;
  control_iss?: string;
  user?: string;
  pass?: string;
  key?: string | Uint8Array;
  verify_iss?: string;
  verify_key?: string | Uint8Array;
}
