import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Item, Format } from '../../../src/index.js';

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

const fmt1a = new TestFormat1('body1a');
const fmt2a = new TestFormat2('body2a');

describe('Item', () => {
    describe('#constructor', () => {
        it('test case', () => {
            const itm = new Item(fmt1a);
            assert.strictEqual(itm.formats[0], fmt1a);
        });
        it('test case', () => {
            const itm = new Item(fmt1a, 'id');
            assert.strictEqual(itm.formats[0], fmt1a);
            assert.strictEqual(itm.id, 'id');
        });
        it('test case', () => {
            const itm = new Item(fmt1a, 'id', 'prev-id');
            assert.strictEqual(itm.formats[0], fmt1a);
            assert.strictEqual(itm.id, 'id');
            assert.strictEqual(itm.prevId, 'prev-id');
        });
        it('test case', () => {
            const itm = new Item([fmt1a, fmt2a]);
            assert.strictEqual(itm.formats[0], fmt1a);
            assert.strictEqual(itm.formats[1], fmt2a);
        });
    });
    describe('#export', () => {
        it('test case', () => {
            const itm = new Item(fmt1a);
            assert.ok(!('id' in itm.export()));
            assert.ok(!('prev-id' in itm.export()));
            assert.strictEqual(
                JSON.stringify(itm.export().formats['testformat1']),
                JSON.stringify({ content: 'body1a' })
            );
        });
        it('test case', () => {
            const itm = new Item([fmt1a, fmt2a]);
            assert.ok(!('id' in itm.export()));
            assert.ok(!('prev-id' in itm.export()));
            assert.strictEqual(
                JSON.stringify(itm.export().formats['testformat1']),
                JSON.stringify({ content: 'body1a' })
            );
            assert.strictEqual(
                JSON.stringify(itm.export().formats['testformat2']),
                JSON.stringify({ content: 'body2a' })
            );
        });
        it('test case that throws', () => {
            assert.throws(() => {
                const itm = new Item([fmt1a, fmt1a]);
                itm.export();
            }, Error);
        });
        it('test case', () => {
            const itm = new Item(fmt1a, 'id', 'prev-id');
            assert.strictEqual(itm.export()['id'], 'id');
            assert.strictEqual(itm.export()['prev-id'], 'prev-id');
            assert.strictEqual(
                JSON.stringify(itm.export().formats['testformat1']),
                JSON.stringify({ content: 'body1a' })
            );
        });
    });
});
