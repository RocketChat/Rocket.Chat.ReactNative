import { fireEvent, render, screen } from '@testing-library/react-native';

import { ReviewButton } from '../ReviewButton';

jest.mock('~/theme', () => ({
	useTheme: () => ({ theme: 'light', colors: { buttonBackgroundPrimaryDefault: '#054', fontDefault: '#000' } })
}));
jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (k: string) => k } }));

test('renders and fires onPress', () => {
	const onPress = jest.fn();
	render(<ReviewButton onPress={onPress} />);
	expect(screen.getByLabelText('Review_message')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
	fireEvent.press(screen.getByLabelText('Review_message'));
	expect(onPress).toHaveBeenCalledTimes(1);
});
