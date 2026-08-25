import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import TwoFactor from '.';
import { twoFactor } from '../../lib/services/twoFactor';
import { isTwoFactorCancelled } from '../../lib/services/twoFactorCancelled';

jest.mock('../../lib/services/restApi', () => ({
	sendEmailCode: jest.fn()
}));

jest.mock('../../lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => false
}));

const requestTwoFactor = () => twoFactor({ method: 'totp', invalid: false });

describe('TwoFactor', () => {
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
});
