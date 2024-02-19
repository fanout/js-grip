export interface IWebSocketEvent {
    type: string;
    content: Uint8Array | number[] | string | null;

    getType(): string;
    getContent(): Uint8Array | number[] | string | null;
}
