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
        it('constructs with format', () => {
            const itm = new Item(fmt1a);
            assert.strictEqual(itm.formats[0], fmt1a);
        });
        it('constructs with format and id', () => {
            const itm = new Item(fmt1a, 'id');
            assert.strictEqual(itm.formats[0], fmt1a);
            assert.strictEqual(itm.id, 'id');
        });
        it('constructs with format, id, and prev-id', () => {
            const itm = new Item(fmt1a, 'id', 'prev-id');
            assert.strictEqual(itm.formats[0], fmt1a);
            assert.strictEqual(itm.id, 'id');
            assert.strictEqual(itm.prevId, 'prev-id');
        });
        it('constructs with multiple formats', () => {
            const itm = new Item([fmt1a, fmt2a]);
            assert.strictEqual(itm.formats[0], fmt1a);
            assert.strictEqual(itm.formats[1], fmt2a);
        });
    });
    describe('#export', () => {
        it('exports single format', () => {
            const itm = new Item(fmt1a);
            assert.ok(!('id' in itm.export()));
            assert.ok(!('prev-id' in itm.export()));
            assert.strictEqual(
                JSON.stringify(itm.export().formats['testformat1']),
                JSON.stringify({ content: 'body1a' })
            );
        });
        it('exports multiple formats', () => {
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
        it('throws when same format appears multiple times', () => {
            assert.throws(() => {
                const itm = new Item([fmt1a, fmt1a]);
                itm.export();
            }, Error);
        });
        it('exports item with id and prev-id', () => {
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
