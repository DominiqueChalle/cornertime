import {
    decodeBase64,
    deserialize,
    deserializePreset,
    deserializeReport,
    encodeBase64,
    serialize,
    serializePreset,
    serializeReport,
    wrapLines,
} from './serialization';
import * as assert from 'assert';
import PunishmentStateMachine from './state';
import { defaultPreset } from './models';


describe('wrapLines', () => {
    it('survives the empty string', () => {
        assert.equal(wrapLines(''), '');
    });

    it('splits a long string into lines', () => {
        assert.equal(wrapLines('123456789', 4), '1234\n5678\n9');
    });

    it('does not insert a trailing newline', () => {
        assert.equal(wrapLines('123456', 3), '123\n456');
    });
});


describe('encodeBase64 and decodeBase64', () => {
    it('are the reverse of each other while respecting Unicode characters', () => {
        const str = '✓ à la mode';
        assert.equal(decodeBase64(encodeBase64(str)), str);
    });
});


// single field only to avoid failures with key ordering
const knownObject = {a: 5};
const knownSerialized = `-----BEGIN CORNERTIME PUNISHMENT REPORT-----
eyJhIjo1fQ==
-----END CORNERTIME PUNISHMENT REPORT-----`;
const headerMissing = 'eyJhIjo1fQ==\n-----END CORNERTIME PUNISHMENT REPORT-----';
const footerMissing = '-----BEGIN CORNERTIME PUNISHMENT REPORT-----\neyJhIjo1fQ==';


describe('serialize', () => {
    it('serializes a known input into a known output', () => {
        assert.equal(serialize(knownObject, 'PUNISHMENT REPORT'), knownSerialized);
    });
});


describe('deserialize', () => {
    it('deserializes a known input into a known output', () => {
        assert.deepEqual(deserialize(knownSerialized, 'PUNISHMENT REPORT'), knownObject);
    });

    it('complains loudly if header/footer are missing', () => {
        assert.throws(() => deserialize(headerMissing, 'PUNISHMENT REPORT'));
        assert.throws(() => deserialize(footerMissing, 'PUNISHMENT REPORT'));
    });

    it('accepts Base64 data without markers', () => {
        assert.deepEqual(
            deserialize('eyJhIjo1fQ==', 'PUNISHMENT REPORT'),
            knownObject
        );
    });

    it('accepts missing or extra marker hyphens', () => {
        const fewerHyphens = knownSerialized
            .replace('-----BEGIN', '----BEGIN')
            .replace('-----END', '----END');

        const extraHyphens = knownSerialized
            .replace('-----BEGIN', '------BEGIN')
            .replace('-----END', '------END');

        assert.deepEqual(
            deserialize(fewerHyphens, 'PUNISHMENT REPORT'),
            knownObject
        );

        assert.deepEqual(
            deserialize(extraHyphens, 'PUNISHMENT REPORT'),
            knownObject
        );
    });

    it('rejects invalid Base64 data', () => {
        assert.throws(
            () => deserialize('Not valid Base64!', 'PUNISHMENT REPORT')
        );
    });

    it('rejects invalid JSON content', () => {
        const invalidJson = encodeBase64('not JSON');

        assert.throws(
            () => deserialize(invalidJson, 'PUNISHMENT REPORT')
        );
    });

});


describe('serializeReport and deserializeReport', () => {
    it('are reverse of each other', () => {
        const sm = new PunishmentStateMachine();
        sm.getReady();
        while (sm.state !== 'finished') {
            sm.tick();
        }

        const report = sm.report();

        assert.deepEqual(deserializeReport(serializeReport(report)), report);
    });
});


describe('serializePreset and deserializePreset', () => {
    it('are the reverse of each other', () => {
        assert.deepEqual(deserializePreset(serializePreset(defaultPreset)), defaultPreset);
    });
});
