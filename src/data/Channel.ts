import { IExportedChannel } from './IExportedChannel';

// The Channel class is used to represent a channel in a GRIP proxy and
// tracks the previous ID of the last message.

export class Channel {
    public name?: string;
    public prevId: string | null;

    constructor(name: string, prevId: string | null = null) {
        this.name = name;
        this.prevId = prevId;
    }

    // Export this channel instance into a dictionary containing the
    // name and previous ID value.
    export(): IExportedChannel {
        const obj = { name: this.name } as IExportedChannel;
        if (this.prevId != null) {
            obj.prevId = this.prevId;
        }
        return obj;
    }
}
