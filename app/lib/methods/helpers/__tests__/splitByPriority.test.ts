import type { PriorityTile, SlotContext } from '../splitByPriority';
import {
	MAX_VISIBLE_TILES,
	absorbLonelyTile,
	gridColumnStartFor,
	pickFeaturedTile,
	splitByPriority,
	tilePriority
} from '../splitByPriority';

const tile = (id: string, extra: Partial<PriorityTile> = {}): PriorityTile => ({ id, hasCamera: false, ...extra });

const tiles = (count: number) => Array.from({ length: count }, (_, i) => tile(`p${i}`));

const context = (extra: Partial<SlotContext> = {}): SlotContext => ({ activeSpeakerId: null, selfId: 'me', ...extra });

const ids = (list: PriorityTile[]) => list.map(({ id }) => id);

describe('MAX_VISIBLE_TILES', () => {
	it('leaves room for eight tiles and the overflow tile', () => {
		const { visible, hidden } = splitByPriority(tiles(12), MAX_VISIBLE_TILES, context());
		expect(visible).toHaveLength(8);
		expect(hidden).toHaveLength(4);
	});
});

describe('tilePriority', () => {
	it('adds 1000 for the speaker, 100 for a camera and 50 for the reader', () => {
		expect(tilePriority(tile('ada'), context())).toBe(0);
		expect(tilePriority(tile('ada'), context({ activeSpeakerId: 'ada' }))).toBe(1000);
		expect(tilePriority(tile('ada', { hasCamera: true }), context())).toBe(100);
		expect(tilePriority(tile('me'), context())).toBe(50);
		expect(tilePriority(tile('me', { hasCamera: true }), context({ activeSpeakerId: 'me' }))).toBe(1150);
	});
});

describe('pickFeaturedTile', () => {
	const all = [tile('me'), tile('ada'), tile('bob')];

	it('features whoever is speaking', () => {
		expect(pickFeaturedTile(all, context({ activeSpeakerId: 'bob' })).id).toBe('bob');
	});

	it('falls back to the first person who is not the reader', () => {
		expect(pickFeaturedTile(all, context()).id).toBe('ada');
	});

	it('features the reader when they are alone', () => {
		expect(pickFeaturedTile([tile('me')], context()).id).toBe('me');
	});

	it('features the reader when they are the speaker', () => {
		expect(pickFeaturedTile(all, context({ activeSpeakerId: 'me' })).id).toBe('me');
	});
});

describe('splitByPriority', () => {
	it('shows everyone when they fit', () => {
		const all = tiles(9);
		expect(splitByPriority(all, 9, context({ selfId: 'p0' }))).toEqual({ visible: all, hidden: [] });
	});

	it('keeps one slot for the overflow tile', () => {
		const { visible, hidden } = splitByPriority(tiles(10), 9, context({ selfId: 'p0' }));
		expect(visible).toHaveLength(8);
		expect(hidden).toHaveLength(2);
	});

	it('ranks the speaker, then cameras, then the reader, and keeps the call order among the shown', () => {
		const all = [tile('p0'), tile('p1'), tile('p2', { hasCamera: true }), tile('p3'), tile('p4')];
		const { visible, hidden } = splitByPriority(all, 4, context({ activeSpeakerId: 'p4', selfId: 'p1' }));
		expect(ids(visible)).toEqual(['p1', 'p2', 'p4']);
		expect(ids(hidden)).toEqual(['p0', 'p3']);
	});

	it('lets the speaker outrank a camera and the reader together', () => {
		const all = [tile('me', { hasCamera: true }), tile('ada'), tile('bob')];
		const { visible } = splitByPriority(all, 2, context({ activeSpeakerId: 'bob' }));
		expect(ids(visible)).toEqual(['bob']);
	});

	it('shows nothing but the overflow when a single slot is left', () => {
		const { visible, hidden } = splitByPriority(tiles(3), 1, context({ selfId: 'p0' }));
		expect(visible).toEqual([]);
		expect(hidden).toHaveLength(3);
	});
});

describe('absorbLonelyTile', () => {
	it('leaves a full last row alone', () => {
		const split = { visible: tiles(8), hidden: [tile('x')] };
		expect(absorbLonelyTile(split, 3, context())).toEqual(split);
	});

	it('folds the last visible tile into the overflow', () => {
		const result = absorbLonelyTile({ visible: tiles(6), hidden: [tile('x')] }, 3, context());
		expect(ids(result.visible)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4']);
		expect(ids(result.hidden)).toEqual(['p5', 'x']);
	});

	it('folds the tile that least deserves its slot, not whichever came last', () => {
		const visible = [
			tile('me'),
			tile('ada'),
			tile('bob'),
			tile('cam', { hasCamera: true }),
			tile('eve'),
			tile('late', { hasCamera: true })
		];
		const result = absorbLonelyTile({ visible, hidden: [tile('x')] }, 3, context({ activeSpeakerId: 'bob' }));
		expect(ids(result.visible)).toEqual(['me', 'ada', 'bob', 'cam', 'late']);
		expect(ids(result.hidden)).toEqual(['eve', 'x']);
	});

	it('does nothing without an overflow to fold into', () => {
		const split = { visible: tiles(4), hidden: [] };
		expect(absorbLonelyTile(split, 3, context())).toEqual(split);
	});

	it('does nothing in a single column', () => {
		const split = { visible: tiles(4), hidden: [tile('x')] };
		expect(absorbLonelyTile(split, 1, context())).toEqual(split);
	});
});

describe('gridColumnStartFor', () => {
	it('leaves cells on full rows where the grid puts them', () => {
		expect(gridColumnStartFor(0, 6, 3)).toBeUndefined();
		expect(gridColumnStartFor(2, 5, 3)).toBeUndefined();
	});

	it('centres a short last row', () => {
		expect(gridColumnStartFor(3, 5, 3)).toBe(1);
		expect(gridColumnStartFor(4, 5, 3)).toBe(2);
		expect(gridColumnStartFor(4, 5, 4)).toBe(2);
		expect(gridColumnStartFor(6, 7, 3)).toBe(2);
	});
});
