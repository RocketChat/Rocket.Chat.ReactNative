import { getActionWidth, getFullSwipeThreshold, getOpenWidth, getSwipeRelease } from '../swipeRelease';

const width = 400;
const actionWidth = getActionWidth(width);
const openWidth = getOpenWidth(width);
const fullSwipeThreshold = getFullSwipeThreshold(width);

const release = (restingOffset: number, offset: number) => getSwipeRelease({ restingOffset, offset, width });

const closed = { restingOffset: 0, fullSwipe: null };
const leftOpen = { restingOffset: actionWidth, fullSwipe: null };
const rightOpen = { restingOffset: -openWidth, fullSwipe: null };

describe('getSwipeRelease', () => {
	it.each([
		[0, 37, closed],
		[0, 38, leftOpen],
		[0, -37, closed],
		[0, -38, rightOpen],
		[0, 0, closed],
		[actionWidth, 1, leftOpen],
		[actionWidth, 200, leftOpen],
		[actionWidth, 0, closed],
		[actionWidth, -30, closed],
		[-openWidth, -1, rightOpen],
		[-openWidth, -200, rightOpen],
		[-openWidth, 0, closed],
		[-openWidth, 30, closed]
	])('from resting offset %d releasing at %d', (restingOffset, offset, expected) => {
		expect(release(restingOffset, offset)).toEqual(expected);
	});

	it.each([0, actionWidth, -openWidth])('commits a full swipe from resting offset %d and closes', restingOffset => {
		expect(release(restingOffset, fullSwipeThreshold)).toEqual({ ...closed, fullSwipe: 'left' });
		expect(release(restingOffset, -fullSwipeThreshold)).toEqual({ ...closed, fullSwipe: 'right' });
	});
});
