import { type IFormat } from './IFormat.js';
import { type IItem } from './IItem.js';
import { type IItemExport } from './IItemExport.js';

// The Item class is a container used to contain one or more format
// implementation instances where each implementation instance is of a
// different type of format. An Item instance may not contain multiple
// implementations of the same type of format. An Item instance is then
// serialized into a hash that is used for publishing to clients.

export class Item implements IItem {
    public formats: IFormat[];
    public id?: string;
    public prevId?: string;

    constructor(formats: IFormat | IFormat[], id?: string, prevId?: string) {
        // The initialize method can accept either a single Format implementation
        // instance or an array of Format implementation instances. Optionally
        // specify an ID and/or previous ID to be sent as part of the message
        // published to the client.
        formats = Array.isArray(formats) ? formats : [formats];
        this.formats = formats;
        if (arguments.length >= 3) {
            this.prevId = prevId;
        }
        if (arguments.length >= 2) {
            this.id = id;
        }
    }

    // The export method serializes all of the formats, ID, and previous ID
    // into a hash that is used for publishing to clients. If more than one
    // instance of the same type of Format implementation was specified then
    // an error will be raised.
    export(): IItemExport {
        const obj: IItemExport = {
            formats: {},
        };
        if (this.id != null) {
            obj.id = this.id;
        }
        if (this.prevId != null) {
            obj['prev-id'] = this.prevId;
        }

        const alreadyUsedFormatNames = new Set();
        for (const format of this.formats) {
            const name = format.name();
            if (alreadyUsedFormatNames.has(name)) {
                throw new Error(`More than one instance of ${name} specified`);
            }
            alreadyUsedFormatNames.add(name);
            obj.formats[name] = format.export();
        }

        return obj;
    }
}
