import 'core-js';
import 'regenerator-runtime/runtime';
import buffer from 'buffer';

import * as main from './main.mjs';

const defaultExport = main['default'];
for (const key of Object.keys(main)) {
    if (key !== 'default') {
        defaultExport[key] = main[key];
    }
}

defaultExport['Buffer'] = buffer.Buffer;

export default defaultExport;
