var esModule = require('./main.js');

module.exports = esModule.default;

for (var key in esModule) {
    if (esModule.hasOwnProperty(key) && key !== 'default') {
        module.exports[key] = esModule[key];
    }
}
