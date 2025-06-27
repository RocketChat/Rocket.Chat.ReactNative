import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, useWindowDimensions } from 'react-native';

import ResponsiveLayoutProvider, { useResponsiveLayout, FONT_SCALE_LIMIT } from './useResponsiveLayout';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn()
}));

describe('ResponsiveLayoutProvider', () => {
	const renderWithFontScale = (fontScale: number) => {
		(useWindowDimensions as jest.Mock).mockReturnValue({ fontScale });

		const Result = () => {
			const {
				fontScale: contextFontScale,
				isLargeFontScale,
				fontScaleLimited,
				rowHeight,
				rowHeightCondensed
			} = useResponsiveLayout();
			return (
				<Text testID='result'>
					{JSON.stringify({
						contextFontScale,
						isLargeFontScale,
						fontScaleLimited,
						rowHeight,
						rowHeightCondensed
					})}
				</Text>
			);
		};

		return render(
			<ResponsiveLayoutProvider>
				<Result />
			</ResponsiveLayoutProvider>
		);
	};

	it('should apply fontScale below limit correctly', () => {
		const { getByTestId } = renderWithFontScale(1.0);
		const result = JSON.parse(getByTestId('result').props.children);

		expect(result.contextFontScale).toBe(1.0);
		expect(result.isLargeFontScale).toBe(false);
		expect(result.fontScaleLimited).toBe(1.0);
		expect(result.rowHeight).toBeCloseTo(75);
		expect(result.rowHeightCondensed).toBeCloseTo(60);
	});

	it('should limit fontScale above threshold', () => {
		const { getByTestId } = renderWithFontScale(1.5);
		const result = JSON.parse(getByTestId('result').props.children);

		expect(result.contextFontScale).toBe(1.5);
		expect(result.isLargeFontScale).toBe(true);
		expect(result.fontScaleLimited).toBe(FONT_SCALE_LIMIT);
		expect(result.rowHeight).toBeCloseTo(112.5); // 75 * 1.5
		expect(result.rowHeightCondensed).toBeCloseTo(90); // 60 * 1.5
	});
});
