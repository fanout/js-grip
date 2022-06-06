export class PublishException {
    message: string;
    context: any;

    constructor(message: string, context: any) {
        this.message = message;
        this.context = context;
    }
}
