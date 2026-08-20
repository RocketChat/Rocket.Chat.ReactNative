import { getTopVisibleTs } from './useFloatingDate';

const token = (index: number, ts: Date | null, isViewable = true) =>
	({ index, isViewable, key: String(index), item: ts ? { ts } : null }) as any;

describe('getTopVisibleTs', () => {
	const older = new Date('2017-11-09T10:00:00.000Z');
	const newer = new Date('2017-11-10T10:00:00.000Z');

	it('returns null when there are no viewable items', () => {
		expect(getTopVisibleTs([])).toBeNull();
	});

	// The list is inverted, so the highest index is the row at the top of the screen.
	it('returns the ts of the highest index', () => {
		expect(getTopVisibleTs([token(0, newer), token(1, older)])).toBe(older);
	});

	it('ignores non viewable items', () => {
		expect(getTopVisibleTs([token(0, newer), token(1, older, false)])).toBe(newer);
	});

	it('ignores items without ts', () => {
		expect(getTopVisibleTs([token(0, newer), token(1, null)])).toBe(newer);
	});
});
