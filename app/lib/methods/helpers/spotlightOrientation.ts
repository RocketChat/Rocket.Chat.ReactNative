import { TILE_GAP_PX } from './pickTileGridLayout';

export type StageSize = { width: number; height: number };

export type SpotlightOrientation = 'stacked' | 'side-by-side';

export const COLUMN_THUMB_WIDTH = 200;
export const STRIP_THUMB_WIDTH = 140;

const SPOTLIGHT_SIDE_BY_SIDE_ASPECT = 1.5;
const COLUMN_THUMB_HEIGHT = COLUMN_THUMB_WIDTH * (9 / 16);
const STAGE_PADDING = 16;

export const spotlightOrientation = ({ width, height }: StageSize): SpotlightOrientation =>
	height > 0 && width / height >= SPOTLIGHT_SIDE_BY_SIDE_ASPECT ? 'side-by-side' : 'stacked';

export const sidebarCapacity = (size: StageSize, orientation: SpotlightOrientation): number => {
	if (size.width === 0 || size.height === 0) return Infinity;
	if (orientation === 'side-by-side') {
		return Math.max(1, Math.floor((size.height + TILE_GAP_PX) / (COLUMN_THUMB_HEIGHT + TILE_GAP_PX)));
	}
	return Math.max(1, Math.floor((size.width - STAGE_PADDING + TILE_GAP_PX) / (STRIP_THUMB_WIDTH + TILE_GAP_PX)));
};
