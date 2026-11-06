import { arrangeGridTiles } from '../arrangeGridTiles';

const PHONE_STAGE = { width: 377, height: 728 };

const peopleOf = (count: number) =>
	Array.from({ length: count }, (_, index) => ({ id: index === 0 ? 'me' : `user${index}`, hasCamera: false }));

const arrange = (count: number) => arrangeGridTiles(peopleOf(count), PHONE_STAGE, { activeSpeakerId: null, selfId: 'me' });

const gridOf = (count: number) => {
	const { layout } = arrange(count);
	return `${layout.cols}x${layout.rows}`;
};

describe('arrangeGridTiles on a portrait phone', () => {
	it.each([
		[1, '1x1'],
		[2, '1x2'],
		[3, '1x3'],
		[4, '1x4'],
		[5, '2x3'],
		[6, '2x3'],
		[7, '2x4'],
		[8, '2x4'],
		[9, '2x5']
	])('puts %i people in a %s grid', (count, grid) => {
		expect(gridOf(count)).toBe(grid);
	});

	it('shows everyone while they fit', () => {
		const { visible, hidden } = arrange(9);

		expect(visible).toHaveLength(9);
		expect(hidden).toHaveLength(0);
	});

	it('keeps a lone person clamped to a 3:4 tile instead of stretching it', () => {
		const { layout } = arrange(1);

		expect(layout.cellWidth).toBeCloseTo(377);
		expect(layout.cellHeight).toBeCloseTo(377 / (3 / 4));
	});

	it.each([10, 11, 12])('folds %i people into seven tiles and an overflow cell', count => {
		const { visible, hidden, cellCount, layout } = arrange(count);

		expect(visible).toHaveLength(7);
		expect(hidden).toHaveLength(count - 7);
		expect(cellCount).toBe(8);
		expect(`${layout.cols}x${layout.rows}`).toBe('2x4');
	});

	it('gives the active speaker a place in the grid even when they would otherwise be hidden', () => {
		const people = peopleOf(12);

		const { visible } = arrangeGridTiles(people, PHONE_STAGE, { activeSpeakerId: 'user11', selfId: 'me' });

		expect(visible.map(({ id }) => id)).toContain('user11');
	});

	it('always keeps the person using the app in the grid', () => {
		const { visible } = arrange(12);

		expect(visible.map(({ id }) => id)).toContain('me');
	});
});
