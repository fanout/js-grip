import * as jose from 'jose';

export interface IGripConfig {
  control_uri: string;
  control_iss?: string;
  user?: string;
  pass?: string;
  key?: string | JsonWebKey | Uint8Array | jose.KeyLike;
  verify_iss?: string;
  verify_key?: string | JsonWebKey | Uint8Array | jose.KeyLike;
}
