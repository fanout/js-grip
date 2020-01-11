// The WebSocketEvent class represents WebSocket event information that is
// used with the GRIP WebSocket-over-HTTP protocol. It includes information
// about the type of event as well as an optional content field.
export default class WebSocketEvent {
    constructor(type, content = null) {
        // Initialize with a specified event type and optional content information.
        this.type = type;
        this.content = content;
    }

    // Get the event type.
    getType() {
        return this.type;
    }

    // Get the event content.
    getContent() {
        return this.content;
    }
}
