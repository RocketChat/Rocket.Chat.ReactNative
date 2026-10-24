import type { Locator } from 'e2e';

import {
	firstVisible,
	goBack,
	isVisibleNow,
	launchApp,
	openDeepLink,
	scrollAndTap,
	succeeds,
	tapUntilVisible,
	tapWhenUncovered,
	type Fixtures
} from '../flows';

const mockToBeVisible = jest.fn();
const mockToBeHidden = jest.fn();
const mockPoll = jest.fn();

jest.mock('e2e', () => ({
	expect: Object.assign(() => ({ toBeVisible: mockToBeVisible, toBeHidden: mockToBeHidden }), {
		poll: (read: () => Promise<boolean>, options: unknown) => mockPoll(read, options)
	})
}));
jest.mock('e2e/engine', () => ({
	TestError: class extends Error {
		readonly code: string;
		constructor(code: string, message: string) {
			super(message);
			this.code = code;
		}
	}
}));

const failure = (code: string) => Object.assign(new Error(code), { code });
const locator = () => ({
	isVisible: jest.fn(() => Promise.resolve(false)),
	tap: jest.fn(() => Promise.resolve()),
	scrollUntilVisible: jest.fn(() => Promise.resolve())
});
const asLocator = (target: ReturnType<typeof locator>) => target as unknown as Locator;

const setup = (platform: string) => {
	const prompt = locator();
	const destination = locator();
	const device = { openLink: jest.fn(() => Promise.resolve()), alert: jest.fn(() => Promise.resolve()) };
	const screen = { getByRole: () => asLocator(prompt), getByTestId: () => asLocator(destination) };
	const fixtures = { platform, device, screen } as unknown as Fixtures;
	return { fixtures, prompt, destination, device };
};

beforeEach(() => {
	jest.clearAllMocks();
	mockToBeVisible.mockReset().mockResolvedValue(undefined);
	mockToBeHidden.mockReset().mockResolvedValue(undefined);
	mockPoll.mockImplementation((read: () => Promise<boolean>) => ({
		toBe: async (expected: boolean) => {
			if ((await read()) !== expected) throw failure('ASSERTION_FAILED');
		}
	}));
});

describe('flow error boundaries', () => {
	it('returns false only for an expected assertion failure', async () => {
		await expect(succeeds(Promise.reject(failure('ASSERTION_FAILED')))).resolves.toBe(false);
	});

	it.each(['ENGINE_FAILURE', 'INVALID_STATE', 'LOCATOR_AMBIGUOUS', 'ACTION_MAY_HAVE_COMMITTED', 'CANCELLED'])(
		'propagates %s instead of treating it as an assertion miss',
		async code => {
			const error = failure(code);
			await expect(succeeds(Promise.reject(error))).rejects.toBe(error);
		}
	);

	it('preserves a visibility read failure when selecting an arrival', async () => {
		const target = locator();
		const error = failure('ENGINE_FAILURE');
		target.isVisible.mockRejectedValue(error);
		await expect(isVisibleNow(asLocator(target))).rejects.toBe(error);
		await expect(firstVisible([asLocator(target)])).rejects.toBe(error);
	});

	it('does not repeat an action whose outcome is uncertain', async () => {
		const { fixtures } = setup('ios');
		const target = locator();
		const error = failure('ACTION_MAY_HAVE_COMMITTED');
		target.tap.mockResolvedValueOnce(undefined).mockRejectedValueOnce(error);
		target.isVisible.mockResolvedValue(true);
		mockToBeVisible.mockRejectedValueOnce(failure('ASSERTION_FAILED'));

		await expect(tapUntilVisible(fixtures, asLocator(target), 'destination')).rejects.toBe(error);
		expect(target.tap).toHaveBeenCalledTimes(2);
	});

	it('preserves infrastructure failures from a scrolled tap', async () => {
		const target = locator();
		const error = failure('ENGINE_FAILURE');
		target.tap.mockRejectedValueOnce(error);
		await expect(scrollAndTap(asLocator(target), asLocator(target))).rejects.toBe(error);
		expect(target.tap).toHaveBeenCalledTimes(1);
	});

	it('does not let refusal text override an uncertain action error', async () => {
		const target = locator();
		const error = Object.assign(new Error('is covered by another visible element'), { code: 'ACTION_MAY_HAVE_COMMITTED' });
		target.tap.mockRejectedValueOnce(error);
		await expect(tapWhenUncovered(asLocator(target))).rejects.toBe(error);
		expect(target.tap).toHaveBeenCalledTimes(1);
	});

	it('retries a covered target only after a classified refusal to dispatch', async () => {
		jest.useFakeTimers();
		try {
			const target = locator();
			target.tap.mockRejectedValueOnce(
				Object.assign(new Error('is covered by another visible element'), {
					code: 'ACTION_FAILED',
					cause: { code: 'NOT_ACTIONABLE' }
				})
			);
			const result = tapWhenUncovered(asLocator(target));
			await jest.runAllTimersAsync();
			await result;
			expect(target.tap).toHaveBeenCalledTimes(2);
		} finally {
			jest.useRealTimers();
		}
	});
});

describe('deep-link completion', () => {
	it('fails when an Android link does not reach its destination', async () => {
		const { fixtures, destination } = setup('android');
		const error = failure('ASSERTION_FAILED');
		mockToBeVisible.mockRejectedValueOnce(error);
		await expect(openDeepLink(fixtures, 'rocketchat://auth', asLocator(destination))).rejects.toBe(error);
	});

	it('fails when an iOS link never reaches its destination', async () => {
		const { fixtures, destination } = setup('ios');
		await expect(openDeepLink(fixtures, 'rocketchat://auth', asLocator(destination))).rejects.toMatchObject({
			code: 'ASSERTION_FAILED'
		});
	});

	it('accepts the iOS prompt and verifies arrival', async () => {
		const { fixtures, prompt, destination } = setup('ios');
		prompt.isVisible.mockResolvedValue(true);
		destination.isVisible.mockResolvedValueOnce(false).mockResolvedValue(true);
		await openDeepLink(fixtures, 'rocketchat://auth', asLocator(destination));
		expect(prompt.tap).toHaveBeenCalledTimes(1);
	});

	it('does not conceal an iOS runner failure while accepting the prompt', async () => {
		const { fixtures, destination, device } = setup('ios');
		const error = failure('ENGINE_FAILURE');
		device.alert.mockRejectedValueOnce(error);
		await expect(openDeepLink(fixtures, 'rocketchat://auth', asLocator(destination))).rejects.toBe(error);
	});

	it('allows an explicitly absent alert while continuing to verify arrival', async () => {
		const { fixtures, destination, device } = setup('ios');
		destination.isVisible.mockResolvedValueOnce(false).mockResolvedValue(true);
		device.alert.mockRejectedValueOnce(
			Object.assign(failure('ENGINE_FAILURE'), { cause: { details: { reason: 'alert-not-found' } } })
		);
		await openDeepLink(fixtures, 'rocketchat://auth', asLocator(destination));
		expect(device.alert).toHaveBeenCalledTimes(1);
	});

	it('launches iOS when no app session exists yet to show a leftover prompt', async () => {
		const target = locator();
		target.isVisible.mockRejectedValue(failure('APP_NOT_OPEN'));
		const device = { installApp: jest.fn(() => Promise.resolve()) };
		const app = { open: jest.fn(() => Promise.resolve()) };
		const screen = { getByText: () => asLocator(target), getByRole: () => asLocator(target) };
		const fixtures = { platform: 'ios', app, device, screen } as unknown as Fixtures;

		await launchApp(fixtures);
		expect(device.installApp).toHaveBeenCalledWith(undefined, { reinstall: true });
		expect(app.open).toHaveBeenCalled();
	});
});

describe('going back', () => {
	const setupBack = () => {
		const backButton = locator();
		backButton.isVisible.mockResolvedValue(true);
		const screen = { getByTestId: () => asLocator(backButton), getByRole: () => ({ first: () => asLocator(backButton) }) };
		return { fixtures: { platform: 'ios', screen } as unknown as Fixtures, backButton };
	};

	it('picks the back button again when it re-renders before the tap', async () => {
		const { fixtures, backButton } = setupBack();
		backButton.tap.mockRejectedValueOnce(failure('LOCATOR_NOT_FOUND'));
		await goBack(fixtures);
		expect(backButton.tap).toHaveBeenCalledTimes(2);
	});

	it('propagates other tap failures', async () => {
		const { fixtures, backButton } = setupBack();
		const error = failure('ENGINE_FAILURE');
		backButton.tap.mockRejectedValueOnce(error);
		await expect(goBack(fixtures)).rejects.toBe(error);
	});
});
