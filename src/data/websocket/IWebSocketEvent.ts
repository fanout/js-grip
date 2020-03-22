export default interface IWebSocketEvent {
    type: string;
    content: Buffer | Array<number> | string | null;

    getType(): string;
    getContent(): Buffer | Array<number> | string | null;
}