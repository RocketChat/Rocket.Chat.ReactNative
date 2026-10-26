import { fireEvent, render, screen } from '@testing-library/react-native';

import { CancelButton } from '../CancelButton';
import { MessageComposerProvider } from '../../../context';

jest.mock('~/theme', () => ({ useTheme: () => ({ theme: 'light', colors: {} }) }));
jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (k: string) => k } }));

const renderButton = (props: { onPress: () => void; cancelAndDelete?: boolean }) =>
	render(
		<MessageComposerProvider>
			<CancelButton {...props} />
		</MessageComposerProvider>
	);

test('a11y label is cancel when cancelAndDelete', () => {
	renderButton({ onPress: jest.fn(), cancelAndDelete: true });
	expect(screen.getByTestId('message-composer-delete-audio')).toBeOnTheScreen();
	expect(screen.getByLabelText('Cancel_and_delete_recording')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('a11y label is delete otherwise and fires onPress', () => {
	const onPress = jest.fn();
	renderButton({ onPress });
	expect(screen.getByLabelText('Delete_recording')).toBeOnTheScreen();
	fireEvent.press(screen.getByTestId('message-composer-delete-audio'));
	expect(onPress).toHaveBeenCalledTimes(1);
	expect(screen.toJSON()).toMatchSnapshot();
});
