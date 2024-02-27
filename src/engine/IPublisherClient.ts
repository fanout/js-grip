import * as jose from 'jose';
import * as Auth from '../auth/index.js';
import { JwkKey, PemKey } from '../utilities/index.js';
import type { IItem } from "../data/index.js";

export interface IPublisherClient {
  getAuth?(): Auth.IAuth | undefined;
  getVerifyIss?(): string | undefined;
  getVerifyKey?(): Uint8Array | jose.KeyLike | PemKey | JwkKey | undefined;

  publish(channel: string, item: IItem): Promise<void>;
}
