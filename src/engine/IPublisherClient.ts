import * as Auth from '../auth/index.js';
import { IItem } from "../data/index.js";

export interface IPublisherClient {
  getAuth(): Auth.IAuth | undefined;
  getVerifyIss(): string | undefined;
  getVerifyKey(): Uint8Array | undefined;

  publish(channel: string, item: IItem): Promise<void>;
}
