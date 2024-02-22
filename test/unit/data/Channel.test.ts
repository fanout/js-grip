import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Channel } from '../../../src/index.js';

describe('Channel', () => {

    describe('Initialize', () => {
        it('should allow creating a Channel with a name', () => {
            const ch = new Channel('name');
            assert.equal(ch.name, 'name');
            assert.equal(ch.prevId, null);
        });
        it('should allow creating a Channel with both a name and a prevId', () => {
            const ch = new Channel('name', 'prev-id');
            assert.equal(ch.name, 'name');
            assert.equal(ch.prevId, 'prev-id');
        })
    });

    describe('Export', () => {
        it('should allow exporting a Channel with a name', () => {
            const ch = new Channel('name');
            assert.equal(JSON.stringify(ch.export()), JSON.stringify({
                name: 'name'
            }));
        });
        it('should allow exporting a Chanel with a name and a prevId', () => {
            const ch = new Channel('name', 'prev-id');
            assert.equal(JSON.stringify(ch.export()), JSON.stringify({
                name: 'name', prevId: 'prev-id'
            }));
        });
    });

});

