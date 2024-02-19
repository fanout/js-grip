export interface IWebSocketEvent {
    type: string;
    content: Uint8Array | string | null;

    getType(): string;
    getContent(): Uint8Array | string | null;
}
