export type TRowState = -1 | 0 | 1;

export interface ISwipeRelease {
	toValue: number;
	rowState: TRowState;
	fullSwipe: 'left' | 'right' | null;
}

interface ISwipeReleaseInput {
	rowState: TRowState;
	offset: number;
	actionWidth: number;
	openWidth: number;
	fullSwipeThreshold: number;
}

const CLOSED: ISwipeRelease = { toValue: 0, rowState: 0, fullSwipe: null };

export const getSwipeRelease = ({
	rowState,
	offset,
	actionWidth,
	openWidth,
	fullSwipeThreshold
}: ISwipeReleaseInput): ISwipeRelease => {
	if (offset >= fullSwipeThreshold) {
		return { ...CLOSED, fullSwipe: 'left' };
	}
	if (offset <= -fullSwipeThreshold) {
		return { ...CLOSED, fullSwipe: 'right' };
	}
	const side: TRowState = offset > 0 ? -1 : 1;
	const openThreshold = rowState === 0 ? actionWidth / 2 : Number.MIN_VALUE;
	if ((rowState !== 0 && rowState !== side) || Math.abs(offset) < openThreshold) {
		return CLOSED;
	}
	return { toValue: side === -1 ? actionWidth : -openWidth, rowState: side, fullSwipe: null };
};
