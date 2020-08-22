/**
 * Main entry for browser-demo.
 * This is meant to execute in a browser (it uses `window`)
 */

import { Publisher } from "@fanoutio/grip";

main().then(() => {
  console.log('browser-demo started.');
});

/**
 * Main browser-demo.
 * Render a message and boot the web worker.
 */
async function main() {
  const { window } = webContext();
  if (window) {
    await windowReadiness(window);
    render(window);
    bootWebWorker(window);
  } else {
    console.warn("No web window. Can't run browser-demo.");
  }
}

/**
 * Render a message showing off pubcontrol.
 * Show it wherever the html has opted into replacement.
 */
function render({ document }) {
  console.debug("rendering");
  document.querySelectorAll(".replace-with-pubcontrol").forEach(el => {
    el.innerHTML = `
    <div>
      <h2>pubcontrol default export</h2>
      <pre>${JSON.stringify(objectSchema(Publisher), null, 2)}</pre>
    </div>
    `;
  });
}

/** Promise of DOM ready event in the provided document */
function windowReadiness({ document }) {
  if (document.readyState === "loading") {
    // Loading hasn't finished yet
    return new Promise((resolve, reject) =>
      document.addEventListener("DOMContentLoaded", resolve)
    );
  }
  // it's ready
}

/** given an object, return some JSON that describes its structure */
function objectSchema(obj) {
  const props = Object.entries(obj).reduce(
    (reduced, [key, val]) => Object.assign(reduced, { [key]: typeof val }),
    {}
  );
  return props;
}

/** Get web browser globals { window, document } in a blessed way, or error */
function webContext() {
  const window = typeof global.window !== "undefined" && global.window;
  const document = typeof global.document !== "undefined" && global.document;
  const context = { document, window };
  if (!context.document) {
    throw new Error(
      "pubcontrol browser-demo must be run with a global document"
    );
  }
  return context;
}

/**
 * Create and initialize the browser-demo web worker in a DOM Worker.
 * Send the worker some configuration from this url's query params.
 */
function bootWebWorker({ Worker }) {
  const webWorker = Object.assign(
    new Worker("pubcontrol-browser-demo.webworker.js"),
    {
      onmessage: event => {
        console.debug("Message received from worker", event.data.type, event);
      }
    }
  );
  webWorker.postMessage({
    type: "Hello",
    from: "browser",
    content: "Hello worker. I booted you out here in pubcontrol-browser-demo."
  });
  const url = new URL(global.location.href);
  const epcp = {
    uri: url.searchParams.get("epcp.uri"),
    defaultChannel: url.searchParams.get("epcp.defaultChannel")
  };
  const iss = url.searchParams.get("epcp.iss");
  if (iss != null) {
    epcp.iss = iss;
  }
  const key = url.searchParams.get("epcp.key");
  if (key != null) {
    epcp.key = key;
  }

  if (![epcp.uri, epcp.defaultChannel].every(Boolean)) {
    console.warn(
      "Missing one of ?epcp.uri or ?epcp.defaultChannel query params."
    );
  }
  webWorker.postMessage({
    type: "EPCPConfiguration",
    ...epcp
  });
}
