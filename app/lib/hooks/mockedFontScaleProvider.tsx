import React from 'react';

import { ResponsiveLayoutContext } from './useResponsiveLayout';

type Props = {
	children: React.ReactNode;
	fontScale?: number;
};

export const MockResponsiveFontScaleProvider = ({ children, fontScale = 1.4 }: Props) => {
	const isLargeFontScale = fontScale > 1.3;

	return (
		<ResponsiveLayoutContext.Provider value={{ fontScale, isLargeFontScale, rowHeight: 0, rowHeightCondensed: 0 }}>
			{children}
		</ResponsiveLayoutContext.Provider>
	);
};
