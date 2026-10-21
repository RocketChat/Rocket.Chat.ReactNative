import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import type { StageSize } from '~/lib/methods/helpers/spotlightOrientation';

export const useStageSize = (): [(event: LayoutChangeEvent) => void, StageSize] => {
	const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

	const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
		setSize(current =>
			current.width === layout.width && current.height === layout.height
				? current
				: { width: layout.width, height: layout.height }
		);
	};

	return [onLayout, size];
};
