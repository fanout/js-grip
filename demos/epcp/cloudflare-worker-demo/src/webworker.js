import { testPubcontrol } from "./test";

main();

/**
 * Main browser-demo webworker.
 * Listen for messages from the host page.
 * When configured for EPCP, maybe test pubcontrol with that configuration.
 */
function main() {
  let state = {};
  const setState = stateUpdates => {
    state = { ...state, ...stateUpdates };
  };
  addEventListener("message", async event => {
    console.debug("Message received from main script", event.data.type, event);
    switch (event.data.type) {
      case "Hello":
        postMessage({
          type: "HelloResponse",
          content: `And hello to you, ${event.data.from}`
        });
        break;
      case "EPCPConfiguration":
        setState({
          epcp: event.data
        });
        await testPubcontrol(event.data);
        break;
      default:
        console.debug(
            "Encountered unexpected event type",
            event.data.type,
            event
        );
    }
  });

}
