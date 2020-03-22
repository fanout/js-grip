export default interface IWebSocketEvent {
    type: string;
    content: Buffer | string | null;

    getType(): string;
    getContent(): Buffer | string | null;
}