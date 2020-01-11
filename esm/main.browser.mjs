import 'core-js';
import 'regenerator-runtime/runtime';
import { Buffer } from 'buffer';

import * as main from './main.mjs';

const defaultExport = main['default'];
for (const key of Object.keys(main)) {
    if (key !== 'default') {
        defaultExport[key] = main[key];
    }
}

defaultExport['Buffer'] = Buffer;

export default defaultExport;
