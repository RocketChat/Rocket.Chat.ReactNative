import { moveIndex, orderedIds, swapWithNeighbour, toPositions } from '../sortablePositions';

describe('sortablePositions', () => {
	const positions = toPositions(['a', 'b', 'c', 'd']);

	it('shifts the rows in between up when a row moves down', () => {
		expect(orderedIds(moveIndex(positions, 0, 2))).toEqual(['b', 'c', 'a', 'd']);
	});

	it('shifts the rows in between down when a row moves up', () => {
		expect(orderedIds(moveIndex(positions, 3, 1))).toEqual(['a', 'd', 'b', 'c']);
	});

	it('swaps a row with its neighbour', () => {
		expect(swapWithNeighbour(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
	});

	it('does not move a row past either end', () => {
		expect(swapWithNeighbour(['a', 'b'], 0, -1)).toBeUndefined();
		expect(swapWithNeighbour(['a', 'b'], 1, 1)).toBeUndefined();
	});
});
