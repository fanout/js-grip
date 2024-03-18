import { type PublishContext } from './index.js';

export class PublishException {
    message: string;
    context: PublishContext;

    constructor(message: string, context: PublishContext) {
        this.message = message;
        this.context = context;
    }
}
