import type { SheetDetent } from '@lodev09/react-native-true-sheet';

import type { TActionSheetOptions } from './Provider';

export const ACTION_SHEET_MIN_HEIGHT_FRACTION = 0.35;
export const ACTION_SHEET_MAX_HEIGHT_FRACTION = 0.75;
export const HANDLE_HEIGHT = 28;
export const CANCEL_HEIGHT = 64;
export const CONTENT_PADDING = 22;

interface IGetDetentsParams {
	data: TActionSheetOptions;
	windowHeight: number;
	contentHeight: number;
	itemHeight: number;
	bottom: number;
}

export const normalizeSnapsToDetents = (snaps: (string | number)[]): number[] =>
	snaps
		.slice(0, 3)
		.map(snap => {
			if (typeof snap === 'number') {
				if (snap <= 0 || snap > 1) return Math.min(1, Math.max(0.1, snap));
				return snap;
			}
			const match = String(snap).match(/^(\d+(?:\.\d+)?)\s*%$/);
			if (match) return Math.min(1, Math.max(0.1, Number(match[1]) / 100));
			return 0.5;
		})
		.sort((a, b) => a - b);

export const getDetents = ({ data, windowHeight, contentHeight, itemHeight, bottom }: IGetDetentsParams): SheetDetent[] => {
	const hasOptions = (data?.options?.length || 0) > 0;
	const maxSnap = hasOptions
		? Math.min(
				(itemHeight + 0.5) * (data?.options?.length || 0) +
					HANDLE_HEIGHT +
					(data?.headerHeight || 0) +
					bottom +
					(data?.hasCancel ? CANCEL_HEIGHT : 0),
				windowHeight * ACTION_SHEET_MAX_HEIGHT_FRACTION
		  )
		: 0;

	if (data?.snaps?.length) {
		return normalizeSnapsToDetents(data.snaps);
	}
	if (hasOptions) {
		if (maxSnap > windowHeight * 0.6) {
			return [0.5, ACTION_SHEET_MAX_HEIGHT_FRACTION];
		}
		const fraction = Math.max(0.25, Math.min(maxSnap / windowHeight, ACTION_SHEET_MAX_HEIGHT_FRACTION));
		return [fraction];
	}
	if (contentHeight > 0) {
		const heightWithPadding = contentHeight + CONTENT_PADDING;
		const fraction = Math.min(heightWithPadding / windowHeight, ACTION_SHEET_MAX_HEIGHT_FRACTION);
		const contentDetent = Math.max(0.25, fraction);
		return [contentDetent];
	}
	return [ACTION_SHEET_MIN_HEIGHT_FRACTION, 'auto'];
};
