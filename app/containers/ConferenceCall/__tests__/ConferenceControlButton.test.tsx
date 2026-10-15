import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import ConferenceControlButton from '../ConferenceControlButton';

describe('ConferenceControlButton', () => {
	it('is announced by its label rather than its icon', () => {
		const { getByLabelText } = render(<ConferenceControlButton icon='mic' label='Mute' onPress={jest.fn()} />);

		expect(getByLabelText('Mute')).toBeTruthy();
	});

	it('presses', () => {
		const onPress = jest.fn();
		const { getByTestId } = render(<ConferenceControlButton icon='mic' label='Mute' onPress={onPress} testID='button' />);

		fireEvent.press(getByTestId('button'));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('opens its options on a long press without also pressing', () => {
		const onPress = jest.fn();
		const onLongPress = jest.fn();
		const { getByTestId } = render(
			<ConferenceControlButton icon='mic' label='Mute' onPress={onPress} onLongPress={onLongPress} testID='button' />
		);

		fireEvent(getByTestId('button'), 'longPress');

		expect(onLongPress).toHaveBeenCalledTimes(1);
		expect(onPress).not.toHaveBeenCalled();
	});

	it('does nothing while disabled', () => {
		const onPress = jest.fn();
		const { getByTestId } = render(
			<ConferenceControlButton icon='mic' label='Mute' disabled onPress={onPress} testID='button' />
		);

		fireEvent.press(getByTestId('button'));

		expect(onPress).not.toHaveBeenCalled();
	});

	it('tells assistive technology when a control is switched on', () => {
		const { getByTestId } = render(
			<ConferenceControlButton
				renderIcon={() => <Text>hand</Text>}
				label='Lower hand'
				variant='toggled'
				onPress={jest.fn()}
				testID='button'
			/>
		);

		expect(getByTestId('button').props.accessibilityState).toMatchObject({ selected: true });
	});

	it('draws a custom icon in the colour of its state', () => {
		const renderIcon = jest.fn(() => <Text>hand</Text>);
		const { getByText } = render(
			<ConferenceControlButton renderIcon={renderIcon} label='Raise hand' variant='toggled' onPress={jest.fn()} />
		);

		expect(getByText('hand')).toBeTruthy();
		expect(renderIcon).toHaveBeenCalledWith(expect.any(String));
	});

	it('shows a count badge, and none for zero', () => {
		const { getByText, queryByTestId, rerender } = render(
			<ConferenceControlButton icon='team' label='People' badge={3} onPress={jest.fn()} />
		);
		expect(getByText('3')).toBeTruthy();

		rerender(<ConferenceControlButton icon='team' label='People' badge={0} onPress={jest.fn()} />);

		expect(queryByTestId('conference-control-badge')).toBeNull();
	});
});
