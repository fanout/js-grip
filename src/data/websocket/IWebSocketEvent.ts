import { Buffer } from 'node:buffer';

export interface IWebSocketEvent {
    type: string;
    content: Buffer | number[] | string | null;

    getType(): string;
    getContent(): Buffer | number[] | string | null;
}
