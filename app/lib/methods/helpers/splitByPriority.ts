export const MAX_VISIBLE_TILES = 9;

export const OVERFLOW_CELL_KEY = 'overflow';

const SPEAKER_PRIORITY = 1000;
const CAMERA_PRIORITY = 100;
const SELF_PRIORITY = 50;

export type PriorityTile = { id: string; hasCamera: boolean };

export type SlotContext = { activeSpeakerId: string | null; selfId: string };

export type TileSplit<T> = { visible: T[]; hidden: T[] };

export const pickFeaturedTile = <T extends { id: string }>(tiles: T[], { activeSpeakerId, selfId }: SlotContext): T =>
	tiles.find(tile => tile.id === activeSpeakerId) ?? tiles.find(tile => tile.id !== selfId) ?? tiles[0];

export const tilePriority = (tile: PriorityTile, { activeSpeakerId, selfId }: SlotContext): number => {
	const speakerBonus = tile.id === activeSpeakerId ? SPEAKER_PRIORITY : 0;
	const cameraBonus = tile.hasCamera ? CAMERA_PRIORITY : 0;
	const selfBonus = tile.id === selfId ? SELF_PRIORITY : 0;
	return speakerBonus + cameraBonus + selfBonus;
};

export const splitByPriority = <T extends PriorityTile>(tiles: T[], capacity: number, context: SlotContext): TileSplit<T> => {
	if (tiles.length <= capacity) {
		return { visible: tiles, hidden: [] };
	}
	const slotsBesideOverflow = Math.max(0, capacity - 1);
	const scored = tiles.map((tile, index) => ({ index, score: tilePriority(tile, context) }));
	const ranked = scored.sort((a, b) => b.score - a.score);
	const shownIndexes = new Set(ranked.slice(0, slotsBesideOverflow).map(({ index }) => index));
	return {
		visible: tiles.filter((_, index) => shownIndexes.has(index)),
		hidden: tiles.filter((_, index) => !shownIndexes.has(index))
	};
};

export const absorbLonelyTile = <T extends PriorityTile>(
	split: TileSplit<T>,
	cols: number,
	context: SlotContext
): TileSplit<T> => {
	const { visible, hidden } = split;
	const hasOverflow = hidden.length > 0;
	const cellCount = visible.length + (hasOverflow ? 1 : 0);
	const leavesLoneCell = cols > 1 && hasOverflow && visible.length > 0 && cellCount % cols === 1;
	if (!leavesLoneCell) {
		return split;
	}
	const priority = (tile: T) => tilePriority(tile, context);
	const absorbed = visible.reduce((lowest, tile) => (priority(tile) <= priority(lowest) ? tile : lowest));
	return { visible: visible.filter(tile => tile !== absorbed), hidden: [absorbed, ...hidden] };
};

export const gridColumnStartFor = (index: number, count: number, cols: number): number | undefined => {
	const orphans = count % cols;
	const orphanStart = count - orphans;
	if (orphans === 0 || index < orphanStart) {
		return undefined;
	}
	return Math.floor((cols - orphans) / 2) + 1 + (index - orphanStart);
};
