import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import CallActionButton from './CallActionButton';
import * as stories from './CallActionButton.stories';
import { generateSnapshots } from '../../../../.rnstorybook/generateSnapshots';

const onPressMock = jest.fn();

describe('CallActionButton', () => {
	beforeEach(() => {
		onPressMock.mockClear();
	});

	it('should render correctly', () => {
		const { getByTestId } = render(
			<CallActionButton icon='microphone' label='Mute' onPress={onPressMock} testID='call-action-button' />
		);
		expect(getByTestId('call-action-button')).toBeTruthy();
	});

	it('should display the correct label', () => {
		const { getByText } = render(
			<CallActionButton icon='microphone' label='Mute' onPress={onPressMock} testID='call-action-button' />
		);
		expect(getByText('Mute')).toBeTruthy();
	});

	it('should call onPress when pressed', () => {
		const { getByTestId } = render(
			<CallActionButton icon='microphone' label='Mute' onPress={onPressMock} testID='call-action-button' />
		);
		fireEvent.press(getByTestId('call-action-button'));
		expect(onPressMock).toHaveBeenCalledTimes(1);
	});

	it('should not call onPress when disabled', () => {
		const { getByTestId } = render(
			<CallActionButton icon='microphone' label='Mute' onPress={onPressMock} disabled testID='call-action-button' />
		);
		fireEvent.press(getByTestId('call-action-button'));
		expect(onPressMock).not.toHaveBeenCalled();
	});

	it('should render with active variant', () => {
		const { getByTestId } = render(
			<CallActionButton
				icon='microphone-disabled'
				label='Unmute'
				onPress={onPressMock}
				variant='active'
				testID='call-action-button'
			/>
		);
		expect(getByTestId('call-action-button')).toBeTruthy();
	});

	it('should render with danger variant', () => {
		const { getByTestId } = render(
			<CallActionButton icon='phone-end' label='End' onPress={onPressMock} variant='danger' testID='call-action-button' />
		);
		expect(getByTestId('call-action-button')).toBeTruthy();
	});
});

generateSnapshots(stories);
