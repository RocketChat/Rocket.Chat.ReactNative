import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import { confirmEndVoipCallForVideoConf, endVoipCallForVideoConf } from './endVoipCallForVideoConf';
import { isInActiveVoipCall } from './isInActiveVoipCall';
import { useCallStore } from './useCallStore';

jest.mock('~/lib/methods/helpers/info', () => ({
	showConfirmationAlert: jest.fn()
}));

jest.mock('./isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

/** Runs the alert's confirm or dismiss handler as soon as it is presented. */
function answerAlert(answer: 'confirm' | 'dismiss') {
	jest.mocked(showConfirmationAlert).mockImplementation(({ onPress, onCancel }) => {
		if (answer === 'confirm') {
			onPress();
		} else {
			onCancel?.();
		}
	});
}

describe('endVoipCallForVideoConf', () => {
	const endCall = jest.fn();

	beforeEach(() => {
		jest.mocked(showConfirmationAlert).mockReset();
		jest.mocked(isInActiveVoipCall).mockReset().mockReturnValue(false);
		endCall.mockReset();
		useCallStore.setState({ endCall });
	});

	describe('confirmEndVoipCallForVideoConf', () => {
		it('resolves true without asking when no VoIP call is active', async () => {
			await expect(confirmEndVoipCallForVideoConf()).resolves.toBe(true);
			expect(showConfirmationAlert).not.toHaveBeenCalled();
		});

		it('resolves true when the user confirms', async () => {
			jest.mocked(isInActiveVoipCall).mockReturnValue(true);
			answerAlert('confirm');

			await expect(confirmEndVoipCallForVideoConf()).resolves.toBe(true);
			expect(showConfirmationAlert).toHaveBeenCalledTimes(1);
		});

		it('resolves false when the user dismisses', async () => {
			jest.mocked(isInActiveVoipCall).mockReturnValue(true);
			answerAlert('dismiss');

			await expect(confirmEndVoipCallForVideoConf()).resolves.toBe(false);
		});
	});

	describe('endVoipCallForVideoConf', () => {
		it('hangs the active call up', () => {
			jest.mocked(isInActiveVoipCall).mockReturnValue(true);

			endVoipCallForVideoConf();

			expect(endCall).toHaveBeenCalledTimes(1);
		});

		it('is a no-op when no call is active', () => {
			endVoipCallForVideoConf();

			expect(endCall).not.toHaveBeenCalled();
		});
	});
});
