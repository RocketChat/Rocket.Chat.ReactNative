import { getSwipeRelease, type TRowState } from '../swipeRelease';

const actionWidth = 80;
const openWidth = 160;
const fullSwipeThreshold = 240;

const release = (rowState: TRowState, offset: number) =>
	getSwipeRelease({ rowState, offset, actionWidth, openWidth, fullSwipeThreshold });

const closed = { toValue: 0, rowState: 0, fullSwipe: null };
const leftOpen = { toValue: actionWidth, rowState: -1, fullSwipe: null };
const rightOpen = { toValue: -openWidth, rowState: 1, fullSwipe: null };

describe('getSwipeRelease', () => {
	it.each([
		[0, 39, closed],
		[0, 40, leftOpen],
		[0, -39, closed],
		[0, -40, rightOpen],
		[0, 0, closed],
		[-1, 1, leftOpen],
		[-1, 200, leftOpen],
		[-1, 0, closed],
		[-1, -30, closed],
		[1, -1, rightOpen],
		[1, -200, rightOpen],
		[1, 0, closed],
		[1, 30, closed]
	] as [TRowState, number, object][])('from row state %i releasing at %i', (rowState, offset, expected) => {
		expect(release(rowState, offset)).toEqual(expected);
	});

	it.each([-1, 0, 1] as TRowState[])('commits a full swipe from row state %i and closes', rowState => {
		expect(release(rowState, fullSwipeThreshold)).toEqual({ ...closed, fullSwipe: 'left' });
		expect(release(rowState, -fullSwipeThreshold)).toEqual({ ...closed, fullSwipe: 'right' });
	});
});
