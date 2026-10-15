import { type TileGridLayout, tileGridLayout } from './pickTileGridLayout';
import { MAX_VISIBLE_TILES, absorbLonelyTile, type PriorityTile, type SlotContext, splitByPriority } from './splitByPriority';
import type { StageSize } from './spotlightOrientation';

export type GridArrangement<T> = {
	visible: T[];
	hidden: T[];
	cellCount: number;
	layout: TileGridLayout;
};

export const arrangeGridTiles = <T extends PriorityTile>(
	tiles: T[],
	size: StageSize,
	context: SlotContext
): GridArrangement<T> => {
	const split = splitByPriority(tiles, MAX_VISIBLE_TILES, context);
	const measuredCols = tileGridLayout(split.visible.length + (split.hidden.length > 0 ? 1 : 0), size.width, size.height).cols;
	const { visible, hidden } = absorbLonelyTile(split, measuredCols, context);
	const cellCount = visible.length + (hidden.length > 0 ? 1 : 0);
	return { visible, hidden, cellCount, layout: tileGridLayout(cellCount, size.width, size.height, measuredCols) };
};
