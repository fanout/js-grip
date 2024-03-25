// noinspection DuplicatedCode

import { type IGripConfig, parseGripUri, Publisher } from '@fanoutio/grip';
import { buildFanoutGripConfig } from '@fanoutio/grip/fastly-fanout';

// Configure the Publisher.
let gripConfig: string | IGripConfig = 'http://127.0.0.1:5561/';
const gripUrl = process.env.GRIP_URL;
if (gripUrl) {
    gripConfig = parseGripUri(gripUrl, { 'verify-key': process.env.GRIP_VERIFY_KEY });
} else {
    const fanoutServiceId = process.env.FANOUT_SERVICE_ID;
    const fanoutApiToken = process.env.FANOUT_API_TOKEN;
    if (fanoutServiceId != null && fanoutApiToken != null) {
        gripConfig = buildFanoutGripConfig({
            serviceId: fanoutServiceId,
            apiToken: fanoutApiToken,
        });
    }
}
const publisher = new Publisher(gripConfig);

export default publisher;
