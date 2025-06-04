import React from 'react';

import { ResponsiveFontScaleContext } from './useResponsiveFontScale';

type Props = {
	children: React.ReactNode;
	fontScale?: number;
};

export const MockResponsiveFontScaleProvider = ({ children, fontScale = 1.4 }: Props) => {
	const isLargeFontScale = fontScale > 1.3;

	return (
		<ResponsiveFontScaleContext.Provider value={{ fontScale, isLargeFontScale }}>{children}</ResponsiveFontScaleContext.Provider>
	);
};
