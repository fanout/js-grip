import * as jose from 'jose';

import * as Auth from '../auth/index.js';
import { IItem } from "../data/index.js";

export interface IPublisherClient {
  getAuth(): Auth.IAuth | undefined;
  getVerifyIss(): string | undefined;
  getVerifyKey(): Promise<Uint8Array | jose.KeyLike | undefined>;

  publish(channel: string, item: IItem): Promise<void>;
}
