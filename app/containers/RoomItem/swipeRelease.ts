import { ReduceMotion } from 'react-native-reanimated';

const OPEN_RATIO = 0.375;
const FULL_SWIPE_RATIO = 0.53;

export const SWIPE_SPRING_CONFIG = {
	mass: 1,
	stiffness: 150,
	damping: 24.5,
	reduceMotion: ReduceMotion.System
};

export const getOpenWidth = (width: number) => {
	'worklet';
	return width * OPEN_RATIO;
};

export const getActionWidth = (width: number) => {
	'worklet';
	return getOpenWidth(width) / 2;
};

export const getFullSwipeThreshold = (width: number) => {
	'worklet';
	return width * FULL_SWIPE_RATIO;
};

export interface ISwipeRelease {
	restingOffset: number;
	fullSwipe: 'left' | 'right' | null;
}

interface ISwipeReleaseInput {
	restingOffset: number;
	offset: number;
	width: number;
}

const CLOSED: ISwipeRelease = { restingOffset: 0, fullSwipe: null };

export const getSwipeRelease = ({ restingOffset, offset, width }: ISwipeReleaseInput): ISwipeRelease => {
	'worklet';
	const fullSwipeThreshold = getFullSwipeThreshold(width);
	if (offset >= fullSwipeThreshold) {
		return { ...CLOSED, fullSwipe: 'left' };
	}
	if (offset <= -fullSwipeThreshold) {
		return { ...CLOSED, fullSwipe: 'right' };
	}
	const wasOpen = restingOffset !== 0;
	const keepsSide = Math.sign(offset) === Math.sign(restingOffset);
	if (wasOpen ? !keepsSide : Math.abs(offset) < getActionWidth(width) / 2) {
		return CLOSED;
	}
	return { restingOffset: offset > 0 ? getActionWidth(width) : -getOpenWidth(width), fullSwipe: null };
};
