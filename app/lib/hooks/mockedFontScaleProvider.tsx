import React from 'react';

import { FONT_SCALE_LIMIT, ResponsiveLayoutContext } from './useResponsiveLayout';

type Props = {
	children: React.ReactNode;
	fontScale?: number;
};

export const MockResponsiveFontScaleProvider = ({ children, fontScale = 1.4 }: Props) => {
	const isLargeFontScale = fontScale > FONT_SCALE_LIMIT;

	return (
		<ResponsiveLayoutContext.Provider
			value={{ fontScale, isLargeFontScale, rowHeight: 0, rowHeightCondensed: 0, fontScaleLimited: FONT_SCALE_LIMIT }}>
			{children}
		</ResponsiveLayoutContext.Provider>
	);
};
