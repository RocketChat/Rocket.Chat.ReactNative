import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

import CustomModal from './CustomModel';

describe('CustomModal Tests', () => {
	const onCloseMock = jest.fn();

	const ModalContent = (
		<CustomModal open={true} onClose={onCloseMock}>
			<Text testID='modalText'>Modal Content</Text>
		</CustomModal>
	);

	test('renders modal content when open is true', () => {
		const { getByTestId } = render(ModalContent);
		expect(getByTestId('modalText')).toBeTruthy();
	});

	test('does not render modal when open is false', () => {
		const { queryByTestId } = render(
			<CustomModal open={false} onClose={onCloseMock}>
				<Text testID='modalText'>Hidden Content</Text>
			</CustomModal>
		);
		expect(queryByTestId('modalText')).toBeNull();
	});

	test('calls onClose when background is pressed', () => {
		const { getByTestId } = render(
			<CustomModal open={true} onClose={onCloseMock}>
				<TouchableOpacity testID='innerButton'>
					<Text>Don't Close</Text>
				</TouchableOpacity>
			</CustomModal>
		);

		// Fire event outside the modal container (simulate backdrop press)
		const backdrop = getByTestId('modalRoot');
		fireEvent.press(backdrop);

		expect(onCloseMock).toHaveBeenCalled();
	});
});
