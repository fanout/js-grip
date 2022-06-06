import * as assert from "assert";

import { Item, Format } from '../../src';

class TestFormat1 extends Format {
    content: string;
    constructor(content: string) {
        super();
        this.content = content;
    }
    name() {
        return 'testformat1';
    }
    export() {
        return { content: this.content };
    }
}

class TestFormat2 extends Format {
    content: string;
    constructor(content: string) {
        super();
        this.content = content;
    }
    name() {
        return 'testformat2';
    }
    export() {
        return { content: this.content };
    }
}

const fmt1a = new TestFormat1("body1a");
const fmt2a = new TestFormat2("body2a");

describe('Item', function () {
    describe('#constructor', function () {
        it('test case', function () {
            const itm = new Item(fmt1a);
            assert.equal(itm.formats[0], fmt1a);
        });
        it('test case', function () {
            const itm = new Item(fmt1a, "id");
            assert.equal(itm.formats[0], fmt1a);
            assert.equal(itm.id, "id");
        });
        it('test case', function () {
            const itm = new Item(fmt1a, "id", "prev-id");
            assert.equal(itm.formats[0], fmt1a);
            assert.equal(itm.id, "id");
            assert.equal(itm.prevId, "prev-id");
        });
        it('test case', function () {
            const itm = new Item([fmt1a, fmt2a]);
            assert.equal(itm.formats[0], fmt1a);
            assert.equal(itm.formats[1], fmt2a);
        });
    });
    describe('#export', function () {
        it('test case', function () {
            const itm = new Item(fmt1a);
            assert.ok(!("id" in itm.export()));
            assert.ok(!("prev-id" in itm.export()));
            assert.equal(
                JSON.stringify(itm.export().formats["testformat1"]),
                JSON.stringify({ content: "body1a" })
            );
        });
        it('test case', function () {
            const itm = new Item([fmt1a, fmt2a]);
            assert.ok(!("id" in itm.export()));
            assert.ok(!("prev-id" in itm.export()));
            assert.equal(
                JSON.stringify(itm.export().formats["testformat1"]),
                JSON.stringify({ content: "body1a" })
            );
            assert.equal(
                JSON.stringify(itm.export().formats["testformat2"]),
                JSON.stringify({ content: "body2a" })
            );
        });
        it('test case that throws', function () {
            assert.throws(function() {
                const itm = new Item([fmt1a, fmt1a]);
                itm.export();
            }, Error);
        });
        it('test case', function () {
            const itm = new Item(fmt1a, "id", "prev-id");
            assert.equal(itm.export()["id"], "id");
            assert.equal(itm.export()["prev-id"], "prev-id");
            assert.equal(
                JSON.stringify(itm.export().formats["testformat1"]),
                JSON.stringify({ content: "body1a" })
            );
        });
    });
});
