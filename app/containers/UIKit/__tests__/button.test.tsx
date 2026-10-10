import { fireEvent, render } from '@testing-library/react-native';

import UIKitButton from '../Button';

const onPressMock = jest.fn();

describe('UIKitButton', () => {
	beforeEach(() => {
		onPressMock.mockClear();
	});

	it('renders the title', () => {
		const { getByText } = render(<UIKitButton title='Press me!' onPress={onPressMock} />);
		expect(getByText('Press me!')).toBeTruthy();
	});

	it('forwards testID for targeting', () => {
		const { getByTestId } = render(<UIKitButton title='Press me!' onPress={onPressMock} testID='uikit-button' />);
		expect(getByTestId('uikit-button')).toBeTruthy();
	});

	it('triggers onPress on tap', () => {
		const { getByTestId } = render(<UIKitButton title='Press me!' onPress={onPressMock} testID='uikit-button' />);
		fireEvent.press(getByTestId('uikit-button'));
		expect(onPressMock).toHaveBeenCalledTimes(1);
	});

	it('does not trigger onPress while loading or disabled', () => {
		const { getByTestId: getLoading } = render(<UIKitButton title='Press me!' onPress={onPressMock} testID='loading' loading />);
		fireEvent.press(getLoading('loading'));
		const { getByTestId: getDisabled } = render(
			<UIKitButton title='Press me!' onPress={onPressMock} testID='disabled' disabled />
		);
		fireEvent.press(getDisabled('disabled'));
		expect(onPressMock).not.toHaveBeenCalled();
	});
});
