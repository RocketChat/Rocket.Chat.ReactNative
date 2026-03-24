import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import AccessibilityAndAppearanceView from './index';
import { useUserPreferences } from '../../lib/methods/userPreferences';

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() })
}));

jest.mock('../../lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn()
}));

jest.mock('../../lib/hooks/useAppSelector', () => ({
	useAppSelector: () => false
}));

describe('Autoplay GIFs switch', () => {
	it('should change the autoplay switch', () => {
		const mockSetAutoplayGifs = jest.fn();

		(useUserPreferences as jest.Mock).mockImplementation((key: string) => {
			if (key === 'RC_AUTOPLAY_GIFS_PREFERENCES_KEY') {
				return [false, mockSetAutoplayGifs];
			}
			return [false, jest.fn()];
		});

		const { getByTestId } = render(<AccessibilityAndAppearanceView />);

		const autoplaySwitch = getByTestId('accessibility-autoplay-gifs-switch').findByProps({ value: false });
		expect(autoplaySwitch.props.value).toBe(false);

		fireEvent(autoplaySwitch, 'valueChange', true);

		expect(mockSetAutoplayGifs).toHaveBeenCalledWith(true);
	});
});
