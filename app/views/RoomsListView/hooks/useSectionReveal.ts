import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { useRowHeight } from './useGetItemLayout';

export const useSectionReveal = () => {
	const rowHeight = useRowHeight();
	const { height } = useWindowDimensions();
	const [cover, setCover] = useState({ distance: 0, travel: 0, revealKey: 0 });

	const reveal = (headerBottom: number, revealedRows: number) => {
		const distance = revealedRows * rowHeight;
		const travel = Math.min(Math.abs(distance), Math.max(height - headerBottom, 0));
		setCover(previous => ({ distance, travel, revealKey: previous.revealKey + 1 }));
	};

	return { cover, reveal };
};
