import assert from 'assert';

import Channel from '../src/data/Channel';

describe('Channel', function () {

    describe('Initialize', function () {
        it('should allow creating a Channel with a name', function () {
            const ch = new Channel('name');
            assert.equal(ch.name, 'name');
            assert.equal(ch.prevId, null);
        });
        it('should allow creating a Channel with both a name and a prevId', function () {
            const ch = new Channel('name', 'prev-id');
            assert.equal(ch.name, 'name');
            assert.equal(ch.prevId, 'prev-id');
        })
    });

    describe('Export', function () {
        it('should allow exporting a Channel with a name', function () {
            const ch = new Channel('name');
            assert.equal(JSON.stringify(ch.export()), JSON.stringify({
                name: 'name'
            }));
        });
        it('should allow exporting a Chanel with a name and a prevId', function () {
            const ch = new Channel('name', 'prev-id');
            assert.equal(JSON.stringify(ch.export()), JSON.stringify({
                name: 'name', prevId: 'prev-id'
            }));
        });
    });

});

