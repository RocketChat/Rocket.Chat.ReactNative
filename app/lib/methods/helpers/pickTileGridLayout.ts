const TARGET_ASPECT = 16 / 9;
const MIN_ACCEPTABLE_ASPECT = 3 / 4;
const MAX_ACCEPTABLE_ASPECT = 16 / 9;
const IN_BAND_PENALTY_SLOPE = 0.5;
const OUT_OF_BAND_PENALTY_SLOPE = 2;
const FILL_BONUS_WEIGHT = 0.5;

export const TILE_GAP_PX = 8;

export type TileGrid = { rows: number; cols: number };

export type TileGridLayout = TileGrid & {
	cellWidth: number;
	cellHeight: number;
};

const scoreInBandAspect = (aspect: number): number => -Math.abs(Math.log(aspect / TARGET_ASPECT)) * IN_BAND_PENALTY_SLOPE;

const MIN_BAND_EDGE_SCORE = scoreInBandAspect(MIN_ACCEPTABLE_ASPECT);

const scoreAspect = (aspect: number): number => {
	if (aspect >= MIN_ACCEPTABLE_ASPECT && aspect <= MAX_ACCEPTABLE_ASPECT) {
		return scoreInBandAspect(aspect);
	}
	if (aspect < MIN_ACCEPTABLE_ASPECT) {
		return MIN_BAND_EDGE_SCORE - Math.log(MIN_ACCEPTABLE_ASPECT / aspect) * OUT_OF_BAND_PENALTY_SLOPE;
	}
	return -Math.abs(Math.log(aspect / MAX_ACCEPTABLE_ASPECT)) * OUT_OF_BAND_PENALTY_SLOPE;
};

export const pickTileGridLayout = (count: number, width: number, height: number): TileGrid => {
	if (count <= 1 || width <= 0 || height <= 0) return { rows: 1, cols: Math.max(1, count) };

	let best = { rows: 1, cols: count };
	let bestScore = -Infinity;

	for (let cols = 1; cols <= count; cols++) {
		const rows = Math.ceil(count / cols);
		const aspect = width / cols / (height / rows);
		const fillFraction = count / (rows * cols);
		const score = scoreAspect(aspect) + fillFraction * FILL_BONUS_WEIGHT;

		if (score > bestScore) {
			bestScore = score;
			best = { rows, cols };
		}
	}

	return best;
};

export const clampCellToAspectBand = (cellWidth: number, cellHeight: number): { width: number; height: number } => {
	if (cellWidth <= 0 || cellHeight <= 0) return { width: cellWidth, height: cellHeight };
	const aspect = cellWidth / cellHeight;
	if (aspect > MAX_ACCEPTABLE_ASPECT) {
		return { width: cellHeight * MAX_ACCEPTABLE_ASPECT, height: cellHeight };
	}
	if (aspect < MIN_ACCEPTABLE_ASPECT) {
		return { width: cellWidth, height: cellWidth / MIN_ACCEPTABLE_ASPECT };
	}
	return { width: cellWidth, height: cellHeight };
};

const cellExtent = (containerExtent: number, tracks: number): number =>
	tracks > 0 ? Math.max(0, (containerExtent - (tracks - 1) * TILE_GAP_PX) / tracks) : 0;

export const tileGridLayout = (
	count: number,
	width: number,
	height: number,
	cols = pickTileGridLayout(count, width, height).cols
): TileGridLayout => {
	const rows = Math.max(1, Math.ceil(count / cols));
	const { width: cellWidth, height: cellHeight } = clampCellToAspectBand(cellExtent(width, cols), cellExtent(height, rows));
	return { rows, cols, cellWidth, cellHeight };
};
