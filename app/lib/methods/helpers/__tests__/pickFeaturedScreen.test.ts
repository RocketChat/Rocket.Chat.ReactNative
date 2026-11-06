import type { ScreenShare } from '../pickFeaturedScreen';
import { nextPinnedScreen, pickFeaturedScreen, recordShareStarts } from '../pickFeaturedScreen';

const streamA = { id: 'a' };
const streamB = { id: 'b' };
const streamC = { id: 'c' };

const share = (id: string, stream: object): ScreenShare => ({ id, stream, name: id, isLocal: false });

describe('recordShareStarts', () => {
	it('stamps new shares, keeps the stamp of ongoing ones and forgets stopped ones', () => {
		const first = recordShareStarts(new Map(), [share('ada', streamA), share('bob', streamB)], 100);
		expect(first.started).toBe('bob');

		const second = recordShareStarts(first.starts, [share('ada', streamA)], 200);
		expect(second.started).toBeNull();
		expect([...second.starts]).toEqual([['ada', { stream: streamA, startedAt: 100 }]]);
	});

	it('treats a new stream from the same person as a new share', () => {
		const { starts } = recordShareStarts(new Map(), [share('ada', streamA)], 100);
		const again = recordShareStarts(starts, [share('ada', streamC)], 300);
		expect(again.started).toBe('ada');
		expect(again.starts.get('ada')?.startedAt).toBe(300);
	});
});

describe('nextPinnedScreen', () => {
	const shares = [share('ada', streamA), share('bob', streamB)];

	it('gives the pin to a share that just started', () => {
		expect(nextPinnedScreen('ada', 'bob', shares)).toBe('bob');
	});

	it('keeps the pin while the pinned share lasts, and drops it after', () => {
		expect(nextPinnedScreen('ada', null, shares)).toBe('ada');
		expect(nextPinnedScreen('carol', null, shares)).toBeNull();
	});

	it('stays unpinned when nothing is pinned and nothing started', () => {
		expect(nextPinnedScreen(null, null, shares)).toBeNull();
	});
});

describe('pickFeaturedScreen', () => {
	const shares = [share('ada', streamA), share('bob', streamB)];
	const starts = new Map([
		['ada', { stream: streamA, startedAt: 200 }],
		['bob', { stream: streamB, startedAt: 100 }]
	]);

	it('features nothing when nobody shares', () => {
		expect(pickFeaturedScreen([], null, starts)).toBeNull();
	});

	it('features the pinned share', () => {
		expect(pickFeaturedScreen(shares, 'bob', starts)?.id).toBe('bob');
	});

	it('features the latest share when nothing pinned is still there', () => {
		expect(pickFeaturedScreen(shares, null, starts)?.id).toBe('ada');
		expect(pickFeaturedScreen(shares, 'carol', starts)?.id).toBe('ada');
	});

	it('features the first share when none has a recorded start', () => {
		expect(pickFeaturedScreen(shares, null, new Map())?.id).toBe('ada');
	});

	it('does not reorder the shares it is given', () => {
		const given = [...shares];
		pickFeaturedScreen(given, null, starts);
		expect(given).toEqual(shares);
	});
});
