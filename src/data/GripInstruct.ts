import { Channel } from './Channel';
import { createGripChannelHeader, parseChannels } from '../utilities/grip';
import { createKeepAliveHeader, createMetaHeader, createNextLinkHeader } from '../utilities/http';

export class GripInstruct {
    public status?: number;
    public hold?: string;
    public channels: Channel[] = [];
    public timeout = 0;
    public keepAlive?: Buffer | string;
    public keepAliveTimeout = 0;
    public nextLink?: string;
    public nextLinkTimeout = 0;
    public meta?: object; // Intended to be modified/set directly

    public constructor(channels?: Channel | Channel[] | string | string[]) {
        if (channels != null) {
            this.addChannel(channels);
        }
    }

    public addChannel(channels: Channel | Channel[] | string | string[]) {
        this.channels.push(...parseChannels(channels));
    }

    public setStatus(status: number) {
        this.status = status;
    }

    public setHoldLongPoll(timeout?: number) {
        this.hold = 'response';
        if (timeout != null) {
            this.timeout = Math.floor(timeout);
        }
    }

    public setHoldStream() {
        this.hold = 'stream';
    }

    public setKeepAlive(data: string | Buffer, timeout: number) {
        this.keepAlive = data;
        this.keepAliveTimeout = timeout;
    }

    public setNextLink(uri: string, timeout: number = 0) {
        this.nextLink = uri;
        this.nextLinkTimeout = timeout;
    }

    public toHeaders(additionalHeaders?: object) {
        const headers: { [name: string]: string } = {};
        headers['Grip-Channel'] = createGripChannelHeader(this.channels);
        if (this.status != null) {
            headers['Grip-Status'] = `${this.status}`; // Convert to string
        }
        if (this.hold != null) {
            headers['Grip-Hold'] = this.hold;
            if (this.timeout > 0) {
                headers['Grip-Timeout'] = `${this.timeout}`; // Convert to string
            }
            if (this.keepAlive != null) {
                headers['Grip-Keep-Alive'] = createKeepAliveHeader(this.keepAlive, this.keepAliveTimeout);
            }
            if (this.meta != null && Object.entries(this.meta).length > 0) {
                headers['Grip-Set-Meta'] = createMetaHeader(this.meta);
            }
        }
        if (this.nextLink != null) {
            headers['Grip-Link'] = createNextLinkHeader(this.nextLink, this.nextLinkTimeout);
        }
        Object.assign(headers, additionalHeaders);
        return headers;
    }
}
