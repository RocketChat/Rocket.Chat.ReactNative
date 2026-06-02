import { MessageTypeLoad } from '../../../../lib/constants/messageTypeLoad';
import { anchorForTarget, raiseOrRelease, type AnchorMessage } from './anchorResolver';

const at = (id: string, ts: number, t?: string): AnchorMessage => ({ id, ts, t });

const newerLoader = (id: string, ts: number): AnchorMessage => ({ id, ts, t: MessageTypeLoad.NEXT_CHUNK });

describe('anchorForTarget', () => {
	it('returns null when the target is contiguous with the Live Tail (no Newer Loader above it)', () => {
		const messages: AnchorMessage[] = [at('target', 1000), at('newer', 2000), newerLoader('older-loader', 500)];
		expect(anchorForTarget(messages, 'target')).toBeNull();
	});

	it('returns the bounding Newer Loader ts (ms) when one sits above the target', () => {
		const messages: AnchorMessage[] = [at('target', 1000), newerLoader('next-chunk', 1500)];
		expect(anchorForTarget(messages, 'target')).toBe(1500);
	});

	it('chooses the nearest Newer Loader above the target when several exist', () => {
		const messages: AnchorMessage[] = [
			at('target', 1000),
			newerLoader('far', 5000),
			newerLoader('near', 1200),
			newerLoader('mid', 3000)
		];
		expect(anchorForTarget(messages, 'target')).toBe(1200);
	});

	it('ignores Newer Loaders at or below the target ts', () => {
		const messages: AnchorMessage[] = [at('target', 1000), newerLoader('below', 800), newerLoader('above', 2000)];
		expect(anchorForTarget(messages, 'target')).toBe(2000);
	});

	it('returns null when the target is absent', () => {
		const messages: AnchorMessage[] = [at('a', 1000), newerLoader('loader', 2000)];
		expect(anchorForTarget(messages, 'missing')).toBeNull();
	});

	it('normalizes ts whether given as a Date or a number', () => {
		const target: AnchorMessage = { id: 'target', ts: new Date(1000) };
		const loader: AnchorMessage = { id: 'loader', ts: new Date(1500), t: MessageTypeLoad.NEXT_CHUNK };
		expect(anchorForTarget([target, loader], 'target')).toBe(1500);
	});
});

describe('raiseOrRelease', () => {
	it('raises the bound to the Newer Loader nearest the Live Tail when one is present', () => {
		const messages: AnchorMessage[] = [at('m', 1000), newerLoader('a', 2000), newerLoader('b', 4000)];
		expect(raiseOrRelease(messages, 1500)).toBe(4000);
	});

	it('releases to a Live Window (null) when no Newer Loader remains — the Gap to the Live Tail has closed', () => {
		const messages: AnchorMessage[] = [at('m', 1000), at('n', 2000)];
		expect(raiseOrRelease(messages, 1500)).toBeNull();
	});

	it('never releases across an open Gap: returns non-null while a Newer Loader exists', () => {
		const messages: AnchorMessage[] = [at('m', 1000), newerLoader('loader', 2000)];
		expect(raiseOrRelease(messages, 1500)).not.toBeNull();
	});

	it('normalizes ts whether given as a Date or a number', () => {
		const messages: AnchorMessage[] = [
			{ id: 'loader', ts: new Date(3000), t: MessageTypeLoad.NEXT_CHUNK },
			{ id: 'm', ts: new Date(1000) }
		];
		expect(raiseOrRelease(messages, 500)).toBe(3000);
	});
});
