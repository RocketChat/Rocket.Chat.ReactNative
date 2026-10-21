import { clampCellToAspectBand, pickTileGridLayout, tileGridLayout } from '../pickTileGridLayout';

describe('pickTileGridLayout', () => {
	it('puts a single tile, or an unmeasured container, on one row', () => {
		expect(pickTileGridLayout(1, 1000, 600)).toEqual({ rows: 1, cols: 1 });
		expect(pickTileGridLayout(4, 0, 0)).toEqual({ rows: 1, cols: 4 });
	});

	it('lays four tiles out two by two in a widescreen container', () => {
		expect(pickTileGridLayout(4, 1600, 900)).toEqual({ rows: 2, cols: 2 });
	});

	it('stacks two tiles in a tall container instead of putting them side by side', () => {
		expect(pickTileGridLayout(2, 400, 800)).toEqual({ rows: 2, cols: 1 });
	});

	it('prefers a full grid in the band over one just outside it', () => {
		expect(pickTileGridLayout(4, 111, 100)).toEqual({ rows: 2, cols: 2 });
	});

	it('lays six tiles out three by two in a widescreen container', () => {
		expect(pickTileGridLayout(6, 1920, 1080)).toEqual({ rows: 2, cols: 3 });
	});

	it('lays nine tiles out three by three in a widescreen container', () => {
		expect(pickTileGridLayout(9, 1920, 1080)).toEqual({ rows: 3, cols: 3 });
	});
});

describe('clampCellToAspectBand', () => {
	it('narrows a cell wider than 16:9 and shortens one taller than 3:4', () => {
		expect(clampCellToAspectBand(1000, 100)).toEqual({ width: (100 * 16) / 9, height: 100 });
		expect(clampCellToAspectBand(300, 1000)).toEqual({ width: 300, height: 400 });
		expect(clampCellToAspectBand(400, 300)).toEqual({ width: 400, height: 300 });
	});

	it('leaves an unmeasured cell as it is', () => {
		expect(clampCellToAspectBand(0, 0)).toEqual({ width: 0, height: 0 });
		expect(clampCellToAspectBand(100, 0)).toEqual({ width: 100, height: 0 });
	});
});

describe('tileGridLayout', () => {
	it('sizes the cells with the gutters taken out', () => {
		expect(tileGridLayout(4, 1608, 908)).toEqual({ rows: 2, cols: 2, cellWidth: 800, cellHeight: 450 });
	});

	it('never sizes a cell below zero', () => {
		expect(tileGridLayout(4, 0, 0)).toMatchObject({ cellWidth: 0, cellHeight: 0 });
	});

	it('lays out the columns it is given with only the rows the cells need', () => {
		expect(tileGridLayout(6, 1216, 908, 3)).toEqual({ rows: 2, cols: 3, cellWidth: 400, cellHeight: 450 });
	});
});
