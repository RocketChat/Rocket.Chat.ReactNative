import type { SheetDetent } from '@lodev09/react-native-true-sheet';
import { useMemo } from 'react';

const ACTION_SHEET_MIN_HEIGHT_FRACTION = 0.35;
const ACTION_SHEET_MAX_HEIGHT_FRACTION = 0.75;
const SCROLL_ENABLED_THRESHOLD = 0.6;
export const HANDLE_HEIGHT = 28;
const CANCEL_HEIGHT = 32;

function normalizeSnapsToDetents(snaps: (string | number)[]): number[] {
	return snaps
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
}

type UseActionSheetDetentsParams = {
	windowHeight: number;
	bottomInset: number;
	itemHeight: number;
	optionsLength?: number;
	snaps?: (string | number)[];
	headerHeight?: number;
	hasCancel?: boolean;
	contentHeight: number;
};

function heightToDetent(height: number, screenHeight: number): number {
	return Math.max(0, height / screenHeight);
}

export function useActionSheetDetents({
	windowHeight,
	bottomInset,
	itemHeight,
	optionsLength = 0,
	snaps,
	headerHeight = 0,
	hasCancel = false,
	contentHeight
}: UseActionSheetDetentsParams): { detents: SheetDetent[]; maxHeight: number; scrollEnabled: boolean } {
	return useMemo(() => {
		const maxHeight = windowHeight * ACTION_SHEET_MAX_HEIGHT_FRACTION;
		const hasOptions = optionsLength > 0;

		const maxSnap = hasOptions
			? Math.min(
					(itemHeight + 0.5) * optionsLength + HANDLE_HEIGHT + headerHeight + bottomInset + (hasCancel ? CANCEL_HEIGHT : 0),
					maxHeight
			  )
			: 0;

		let detents: SheetDetent[];
		let scrollEnabled = false;

		if (snaps?.length) {
			detents = normalizeSnapsToDetents(snaps);
		} else if (hasOptions) {
			if (maxSnap > windowHeight * SCROLL_ENABLED_THRESHOLD) {
				detents = [0.5, ACTION_SHEET_MAX_HEIGHT_FRACTION];
				scrollEnabled = true;
			} else {
				const measuredHeight =
					optionsLength * itemHeight + HANDLE_HEIGHT + headerHeight + bottomInset + (hasCancel ? CANCEL_HEIGHT : 0);

				scrollEnabled = false;
				detents = [heightToDetent(Math.round(measuredHeight), windowHeight)];
			}
		} else if (contentHeight > 0) {
			const rawContentDetent = (contentHeight + bottomInset) / windowHeight;
			const contentDetent = Math.min(
				ACTION_SHEET_MAX_HEIGHT_FRACTION,
				Math.max(ACTION_SHEET_MIN_HEIGHT_FRACTION, rawContentDetent)
			);

			detents = [contentDetent];
		} else {
			detents = [ACTION_SHEET_MIN_HEIGHT_FRACTION];
		}

		return { detents, maxHeight, scrollEnabled };
	}, [bottomInset, contentHeight, hasCancel, headerHeight, itemHeight, optionsLength, snaps, windowHeight]);
}
