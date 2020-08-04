import IFormat from "./IFormat";
import Publisher from "../engine/Publisher";
import IItem from "./IItem";
import HttpResponseFormat from "./http/HttpResponseFormat";
import HttpStreamFormat from "./http/HttpStreamFormat";

export default class PrefixedPublisher {

    publisher: Publisher;
    prefix: string;

    constructor(
        publisher: Publisher,
        prefix: string
    ) {
        this.publisher = publisher;
        this.prefix = prefix;
    }

    async publish(channel: string, item: IItem) {
        await this.publisher.publish(
            this.prefix + channel,
            item
        );
    };

    async publishFormats(channel: string, formats: IFormat | IFormat[], id?: string, prevId?: string) {
        await this.publisher.publishFormats(
            this.prefix + channel,
            formats,
            id,
            prevId
        );
    };

    async publishHttpResponse(channel: string, data: HttpResponseFormat | string, id?: string, prevId?: string) {
        await this.publisher.publishHttpResponse(
            this.prefix + channel,
            data,
            id,
            prevId
        );
    }

    async publishHttpStream(channel: string, data: HttpStreamFormat | string, id?: string, prevId?: string) {
        await this.publisher.publishHttpStream(
            this.prefix + channel,
            data,
            id,
            prevId,
        );
    }
}