// noinspection DuplicatedCode

import { type IGripConfig, GripInstruct, parseGripUri, Publisher } from '@fanoutio/grip';
import { buildFanoutGripConfig } from '@fanoutio/grip/fastly-fanout';

export interface Env {
	GRIP_URL?: string,
	GRIP_VERIFY_KEY?: string,
	FANOUT_SERVICE_ID?: string,
	FANOUT_API_TOKEN?: string,
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {

		const requestUrl = new URL(request.url);

		// Configure the Publisher.
		// Settings are stored in the environment
		let gripConfig: string | IGripConfig = 'http://127.0.0.1:5561/';
		const gripUrl = env.GRIP_URL;
		if (gripUrl) {
			gripConfig = parseGripUri(gripUrl, { 'verify-key': env.GRIP_VERIFY_KEY });
		} else {
			const fanoutServiceId = env.FANOUT_SERVICE_ID;
			const fanoutApiToken = env.FANOUT_API_TOKEN;
			if (fanoutServiceId != null && fanoutApiToken != null) {
				gripConfig = buildFanoutGripConfig({
					serviceId: fanoutServiceId,
					apiToken: fanoutApiToken,
				});
			}
		}
		const publisher = new Publisher(gripConfig);

		// Find whether we are behind GRIP
		const gripStatus = await publisher.validateGripSig(request.headers.get('grip-sig'));

		if (request.method === 'GET' && requestUrl.pathname === '/api/stream') {
			// Make sure we're behind a GRIP proxy before we proceed
			if (!gripStatus.isProxied) {
				return new Response(
					'[not proxied]\n',
					{
						status: 200,
						headers: {
							'Content-Type': 'text/plain',
						},
					},
				);
			}

			// Create some GRIP instructions and hold the stream
			const gripInstruct = new GripInstruct('test');
			gripInstruct.setHoldStream();

			// Return the response
			// Include the GRIP instructions in the response headers
			return new Response(
				'[stream open]\n',
				{
					status: 200,
					headers: {
						...gripInstruct.toHeaders(),
						'Content-Type': 'text/plain',
					},
				},
			);
		}

		if (request.method === 'POST' && requestUrl.pathname === '/api/publish') {
			// Only accept text bodies
			if (request.headers.get('content-type')?.split(';')[0] !== 'text/plain') {
				return new Response(
					'Body must be text/plain\n', {
						status: 415,
						headers: {
							'Content-Type': 'text/plain',
						},
					},
				);
			}

			// Read the body
			const body = await request.text();

			// Publish the body to GRIP clients that listen to http-stream format
			await publisher.publishHttpStream('test', body + '\n');

			// Return a success response
			return new Response(
				'Ok\n',
				{
					status: 200,
					headers: {
						'Content-Type': 'text/plain',
					},
				},
			);
		}

		// Return an error response
		return new Response('Not found\n', { status: 404 });
	},
};
