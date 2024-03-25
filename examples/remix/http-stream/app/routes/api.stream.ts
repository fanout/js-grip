// noinspection DuplicatedCode

import { LoaderFunctionArgs } from '@remix-run/node';
import { GripInstruct } from '@fanoutio/grip';
import publisher from '~/utils/publisher';

export async function loader({ request }: LoaderFunctionArgs) {

    // Find whether we are behind GRIP
    const gripStatus = await publisher.validateGripSig(request.headers.get('grip-sig'));

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

    // Write the response
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
