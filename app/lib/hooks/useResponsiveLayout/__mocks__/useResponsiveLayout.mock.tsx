import React from 'react';

import { FONT_SCALE_LIMIT, ResponsiveLayoutContext } from '../useResponsiveLayout';

type Props = {
	children: React.ReactNode;
};

export const MockResponsiveLayoutProvider = ({ children }: Props) => {
	const fontScale = 1.4;
	const isLargeFontScale = FONT_SCALE_LIMIT < fontScale;

	return (
		<ResponsiveLayoutContext.Provider
			value={{ fontScale, isLargeFontScale, rowHeight: 0, rowHeightCondensed: 0, fontScaleLimited: FONT_SCALE_LIMIT }}>
			{children}
		</ResponsiveLayoutContext.Provider>
	);
};
