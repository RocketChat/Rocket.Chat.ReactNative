import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import TwoFactor from '..';
import Toast from '../../Toast';
import { showToast } from '~/lib/methods/helpers/showToast';
import { twoFactor } from '~/lib/services/twoFactor/twoFactor';
import { isTwoFactorCancelled } from '~/lib/services/twoFactor/twoFactorCancelled';

jest.mock('react-native-keyboard-controller', () => {
	const { View } = require('react-native');
	return { KeyboardAvoidingView: View };
});

jest.mock('~/lib/services/restApi', () => ({
	sendEmailCode: jest.fn()
}));

jest.mock('~/lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => false
}));

const mockToastHosts: { show: jest.Mock }[] = [];

jest.mock('react-native-easy-toast', () => {
	const { Component } = require('react');
	return class MockEasyToast extends Component {
		show = jest.fn();

		constructor(props: object) {
			super(props);
			mockToastHosts.push(this);
		}

		render() {
			return null;
		}
	};
});

const requestTwoFactor = () => twoFactor({ method: 'totp', invalid: false });

describe('TwoFactor', () => {
	beforeEach(() => {
		mockToastHosts.length = 0;
	});

	it('cancels the displaced prompt and resolves the newest one', async () => {
		const { getByTestId } = render(<TwoFactor />);

		let displacedResult: Promise<unknown> | undefined;
		let newest: ReturnType<typeof requestTwoFactor> | undefined;
		await act(() => {
			displacedResult = requestTwoFactor().catch(error => error);
			newest = requestTwoFactor();
		});

		await waitFor(() => expect(getByTestId('two-factor-input')).toBeTruthy());

		expect(isTwoFactorCancelled(await displacedResult!)).toBe(true);

		fireEvent.changeText(getByTestId('two-factor-input'), '123456');
		await act(() => {
			fireEvent.press(getByTestId('two-factor-send'));
		});

		await expect(newest!).resolves.toEqual({ twoFactorCode: '123456', twoFactorMethod: 'totp' });
	});

	it('shows a toast sent right after the prompt closes on the root toast', async () => {
		const { getByTestId } = render(
			<>
				<Toast />
				<TwoFactor />
			</>
		);
		const [rootHost] = mockToastHosts;

		let request: ReturnType<typeof requestTwoFactor> | undefined;
		await act(() => {
			request = requestTwoFactor();
		});
		await waitFor(() => expect(getByTestId('two-factor-input')).toBeTruthy());

		fireEvent.changeText(getByTestId('two-factor-input'), '123456');
		await act(() => {
			fireEvent.press(getByTestId('two-factor-send'));
		});
		await request;
		act(() => showToast('Profile saved'));

		expect(rootHost.show).toHaveBeenCalledWith('Profile saved', expect.any(Number));
		expect(mockToastHosts.slice(1).every(host => host.show.mock.calls.length === 0)).toBe(true);
	});
});
