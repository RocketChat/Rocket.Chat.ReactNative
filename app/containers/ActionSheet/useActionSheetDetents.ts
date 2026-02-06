import { useMemo } from 'react';

import type { TActionSheetOptions } from './Provider';
import { getDetents } from './utils';

interface UseActionSheetDetentsParams {
	data: TActionSheetOptions;
	windowHeight: number;
	contentHeight: number;
	itemHeight: number;
	bottom: number;
}

export function useActionSheetDetents({
	data,
	windowHeight,
	contentHeight,
	itemHeight,
	bottom
}: UseActionSheetDetentsParams) {
	return useMemo(
		() =>
			getDetents({
				data,
				windowHeight,
				contentHeight,
				itemHeight,
				bottom
			}),
		[data, windowHeight, contentHeight, itemHeight, bottom]
	);
}
