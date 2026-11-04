import { getRoomChanges, patchCategory, removeCategory } from '../categoryUpdates';

const categories = [
	{ _id: 'Unread', name: 'Unread', default: true },
	{ _id: 'design', name: 'Design' },
	{ _id: 'ops', name: 'Ops', showUnreads: true }
];

describe('patchCategory', () => {
	it('changes only the matching category and keeps its other fields', () => {
		expect(patchCategory(categories, 'ops', { keepUnreadsOnTop: true })).toEqual([
			categories[0],
			categories[1],
			{ _id: 'ops', name: 'Ops', showUnreads: true, keepUnreadsOnTop: true }
		]);
	});
});

describe('removeCategory', () => {
	it('drops the category and keeps the order of the rest', () => {
		expect(removeCategory(categories, 'design').map(category => category._id)).toEqual(['Unread', 'ops']);
	});
});

describe('getRoomChanges', () => {
	it('splits the selection into added and removed rooms', () => {
		expect(getRoomChanges(['a', 'b'], ['b', 'c'])).toEqual({ addedRoomIds: ['c'], removedRoomIds: ['a'] });
	});

	it('reports nothing when the selection is unchanged', () => {
		expect(getRoomChanges(['a', 'b'], ['b', 'a'])).toEqual({ addedRoomIds: [], removedRoomIds: [] });
	});
});
