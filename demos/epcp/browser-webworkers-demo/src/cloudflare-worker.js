import { testPubcontrol } from "./test";

main();

/**
 * Cloudflare Worker.
 * Listen for fetch messages and handle requests.
 * When configured for EPCP, maybe test pubcontrol with that configuration.
 */
function main() {
  addEventListener("fetch", event => {
    console.debug("webworker fetch event", event);
    try {
      event.respondWith(handleRequest(event.request));
    } catch (error) {
      return new Response(
        "Something didn’t quite work. Error message: " + error.message,
        {
          status: 500
        }
      );
    }
  });

  async function handleRequest(request) {
    console.log("in handleRequest");
    const url = new URL(request.url);
    let testPubcontrolError;
    let testPubControlResult;
    try {
      testPubControlResult = url.searchParams.get("testPubControl")
        ? await testPubcontrol({
            uri: url.searchParams.get("epcp.uri"),
            defaultChannel: url.searchParams.get("epcp.defaultChannel")
          })
        : {
            message:
              "No ?testPubControl, so I didn't run anything related to epcp"
          };
    } catch (error) {
      testPubcontrolError = error;
    }

    let formattedTestPubControlResult;
    try {
      formattedTestPubControlResult = JSON.stringify(testPubControlResult);
    } catch (error) {
      formattedTestPubControlResult = `ERROR WITH IT!! ${error.message} ${
        error.stack
      }`;
    }
    let formattedTestPubControlError;
    try {
      formattedTestPubControlError =
        testPubcontrolError &&
        String(
          testPubcontrolError.message ||
            ".message was falsy so we used this text"
        );
    } catch (error) {
      formattedTestPubControlError =
        "Error getting this error.message as string";
    }
    const body = `
      <h1>Pubcontrol Cloudflare Worker Demo</h1>
      <p>It works!</p>
      <p>
      epcp.url: ${url.searchParams.get("epcp.uri")}
      </p>
      <p>formattedTestPubControlResult ${formattedTestPubControlResult}</p>
      <p>formattedTestPubControlError ${formattedTestPubControlError}</p>
    `.trim();

    return new Response(body, {
      headers: { "Content-Type": "text/html" }
    });
  }
}
