export type SortablePositions = Record<string, number>;

export const toPositions = (ids: string[]): SortablePositions => Object.fromEntries(ids.map((id, index) => [id, index]));

export const moveIndex = (positions: SortablePositions, from: number, to: number): SortablePositions => {
	'worklet';
	const next: SortablePositions = {};
	Object.keys(positions).forEach(id => {
		const index = positions[id];
		if (index === from) {
			next[id] = to;
		} else if (from < to && index > from && index <= to) {
			next[id] = index - 1;
		} else if (from > to && index >= to && index < from) {
			next[id] = index + 1;
		} else {
			next[id] = index;
		}
	});
	return next;
};

export const orderedIds = (positions: SortablePositions): string[] => {
	'worklet';
	return Object.keys(positions).sort((first, second) => positions[first] - positions[second]);
};

export const swapWithNeighbour = (ids: string[], index: number, offset: -1 | 1): string[] | undefined => {
	const target = index + offset;
	if (target < 0 || target >= ids.length) {
		return undefined;
	}
	const next = [...ids];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
};
