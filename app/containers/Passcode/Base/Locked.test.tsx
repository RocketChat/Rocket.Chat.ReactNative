import { act, render, waitFor } from '@testing-library/react-native';

import Locked from './Locked';
import { TYPE } from '../constants';
import { getLockedUntil } from '../utils';
import { resetAttempts } from '../../../lib/methods/helpers/localAuthentication';
import log from '../../../lib/methods/helpers/log';

jest.mock('../../../theme', () => ({
	useTheme: () => ({
		theme: 'light',
		colors: {
			strokeExtraLight: '#e1e1e1',
			fontTitlesLabels: '#111111',
			fontSecondaryInfo: '#222222'
		}
	})
}));

jest.mock('../../../i18n', () => ({
	t: (key: string, params?: { timeLeft?: number }) => (params?.timeLeft ? `${key}:${params.timeLeft}` : key)
}));

jest.mock('../utils', () => {
	const actual = jest.requireActual('../utils');

	return {
		...actual,
		getLockedUntil: jest.fn()
	};
});

jest.mock('../../../lib/methods/helpers/localAuthentication', () => ({
	resetAttempts: jest.fn()
}));

jest.mock('../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockedGetLockedUntil = getLockedUntil as jest.MockedFunction<typeof getLockedUntil>;
const mockedResetAttempts = resetAttempts as jest.MockedFunction<typeof resetAttempts>;
const mockedLog = log as jest.MockedFunction<typeof log>;

describe('Locked', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-06-03T12:00:00.000Z'));
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('resets attempts and returns to enter mode after the lock expires', async () => {
		mockedGetLockedUntil.mockResolvedValue(new Date(Date.now() + 1500));
		mockedResetAttempts.mockResolvedValue(undefined);
		const setStatus = jest.fn();

		render(<Locked setStatus={setStatus} />);

		await waitFor(() => expect(mockedGetLockedUntil).toHaveBeenCalledTimes(1));

		await act(async () => {
			jest.advanceTimersByTime(2000);
			await Promise.resolve();
		});

		await waitFor(() => expect(mockedResetAttempts).toHaveBeenCalledTimes(1));
		expect(setStatus).toHaveBeenCalledWith(TYPE.ENTER);
	});

	it('still returns to enter mode when clearing attempts fails', async () => {
		mockedGetLockedUntil.mockResolvedValue(new Date(Date.now() + 1500));
		mockedResetAttempts.mockRejectedValue(new Error('storage failed'));
		const setStatus = jest.fn();

		render(<Locked setStatus={setStatus} />);

		await waitFor(() => expect(mockedGetLockedUntil).toHaveBeenCalledTimes(1));

		await act(async () => {
			jest.advanceTimersByTime(2000);
			await Promise.resolve();
		});

		await waitFor(() => expect(mockedResetAttempts).toHaveBeenCalledTimes(1));
		expect(mockedLog).toHaveBeenCalledWith(expect.any(Error));
		expect(setStatus).toHaveBeenCalledWith(TYPE.ENTER);
	});
});
