// The Channel class is used to represent a channel in for a GRIP proxy and
// tracks the previous ID of the last message.
export default class Channel {
    name;
    prevId;

    constructor(name, prevId = null) {
        this.name = name;
        this.prevId = prevId;
    }

    // Export this channel instance into a dictionary containing the
    // name and previous ID value.
    export() {
        const obj = {name: this.name};
        if (this.prevId != null) {
            obj.prevId = this.prevId;
        }
        return obj;
    }
}
