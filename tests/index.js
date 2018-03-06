var fs = require('fs');
var path = require('path')

var TESTS_DIR = __dirname

if (require.main === module) test()


function getTestFiles() {
    var thisFile = __filename
    return fs.readdirSync(TESTS_DIR)
        .filter(function (filename) {
            return path.join(TESTS_DIR, filename) !== thisFile
        })
        .map(function (filename) {
            return path.join(TESTS_DIR, filename)
        })
}

function test () {
    return getTestFiles().forEach(function (filepath) {
        require(filepath)
    })
}
