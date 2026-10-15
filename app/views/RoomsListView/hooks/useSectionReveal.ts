import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { useRowHeight } from './useGetItemLayout';

export const useSectionReveal = (collapsedGroups: ReadonlySet<string>, rowCount: number) => {
	const rowHeight = useRowHeight();
	const { height } = useWindowDimensions();
	const [headerBottom, setHeaderBottom] = useState(0);
	const [cover, setCover] = useState({ collapsedGroups, rowCount, distance: 0, travel: 0, revealKey: 0 });

	if (cover.collapsedGroups !== collapsedGroups) {
		const distance = (rowCount - cover.rowCount) * rowHeight;
		const travel = Math.min(Math.abs(distance), Math.max(height - headerBottom, 0));
		setCover({
			collapsedGroups,
			rowCount,
			distance,
			travel,
			revealKey: cover.revealKey + 1
		});
	} else if (cover.rowCount !== rowCount) {
		setCover({ ...cover, rowCount });
	}

	return { cover, setHeaderBottom };
};
