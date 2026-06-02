import * as LocalAuthentication from 'expo-local-authentication';

import EventEmitter from './events';
import { checkHasPasscode, handleLocalAuthentication } from './localAuthentication';
import { biometricTrustStore } from '../../biometricTrustStore';
import { CHANGE_PASSCODE_EMITTER, LOCAL_AUTHENTICATE_EMITTER } from '../../constants/localAuthentication';

jest.mock('expo-local-authentication', () => ({
	authenticateAsync: jest.fn(),
	isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
	supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([2])),
	AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 }
}));

jest.mock('react-native-bootsplash', () => ({ hide: jest.fn(() => Promise.resolve()) }));

jest.mock('../userPreferences', () => ({
	__esModule: true,
	default: {
		getBool: jest.fn(),
		setBool: jest.fn(),
		getString: jest.fn(),
		setString: jest.fn()
	}
}));

jest.mock('../../store/auxStore', () => ({ store: { dispatch: jest.fn() } }));
jest.mock('../../services/getServerTimeSync', () => ({ getServerTimeSync: jest.fn(() => Promise.resolve(Date.now())) }));
jest.mock('../../../i18n', () => ({ t: (key: string) => key }));

jest.mock('../../biometricTrustStore', () => ({
	biometricTrustStore: {
		verify: jest.fn(),
		enrol: jest.fn(),
		disenrol: jest.fn(),
		hasEnrolment: jest.fn(),
		isEnabled: jest.fn(),
		setEnabled: jest.fn(),
		setBiometryEnabled: jest.fn()
	}
}));

jest.mock('./events', () => ({
	__esModule: true,
	default: { emit: jest.fn(), addEventListener: jest.fn(), removeListener: jest.fn() }
}));

const mockedEmit = EventEmitter.emit as jest.Mock;
const mockedVerify = biometricTrustStore.verify as jest.Mock;
const mockedEnrol = biometricTrustStore.enrol as jest.Mock;
const mockedDisenrol = biometricTrustStore.disenrol as jest.Mock;
const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;
const mockedIsEnabled = biometricTrustStore.isEnabled as jest.Mock;
const mockedIsEnrolled = LocalAuthentication.isEnrolledAsync as jest.Mock;

const lastEmitPayload = () => {
	const calls = mockedEmit.mock.calls.filter(([event]) => event === LOCAL_AUTHENTICATE_EMITTER);
	return calls.length ? calls[calls.length - 1][1] : null;
};

// handleLocalAuthentication opens the passcode modal and computes whether to show the biometry
// button. It does NOT prompt biometry itself — that happens from behind the modal in PasscodeEnter,
// so the OS prompt never appears over uncovered app content. The verify()/invalidation flow is
// exercised in PasscodeEnter.test.tsx and resolveBiometricTrust.test.ts.
describe('handleLocalAuthentication', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedIsEnrolled.mockResolvedValue(true);
		mockedEmit.mockImplementation((event, payload) => {
			if (event === LOCAL_AUTHENTICATE_EMITTER && payload?.submit) {
				setImmediate(() => payload.submit());
			}
		});
	});

	it('biometry disabled → opens modal with hasBiometry: false, no upstream prompt', async () => {
		mockedIsEnabled.mockReturnValue(false);

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false });
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('biometry enabled and supported → opens modal with hasBiometry: true, no upstream prompt', async () => {
		mockedIsEnabled.mockReturnValue(true);

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: true });
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('biometry enabled but device not enrolled → opens modal with hasBiometry: false', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedIsEnrolled.mockResolvedValueOnce(false);

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false });
		expect(mockedVerify).not.toHaveBeenCalled();
	});
});

// First-passcode setup must keep biometry opt-in: enrol writes the sentinel silently, then a single
// verify() prompt asks for consent. Declining tears the sentinel back down and leaves biometry off.
describe('checkHasPasscode → biometry consent on first passcode', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedDisenrol.mockResolvedValue(undefined);
		// No stored passcode → checkHasPasscode runs changePasscode then checkBiometry.
		(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
		mockedEmit.mockImplementation((event, payload) => {
			if (event === CHANGE_PASSCODE_EMITTER && payload?.submit) {
				setImmediate(() => payload.submit('1234'));
			}
		});
	});

	it('enrol succeeds and user consents → prompts once, biometry enabled, no disenrol', async () => {
		mockedEnrol.mockResolvedValueOnce({ kind: 'success' });
		mockedVerify.mockResolvedValueOnce({ kind: 'success' });

		await checkHasPasscode({});

		expect(mockedEnrol).toHaveBeenCalledTimes(1);
		expect(mockedVerify).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(true);
		expect(mockedDisenrol).not.toHaveBeenCalled();
	});

	it("user declines consent ('Don't activate') → disenrols and leaves biometry disabled", async () => {
		mockedEnrol.mockResolvedValueOnce({ kind: 'success' });
		mockedVerify.mockResolvedValueOnce({ kind: 'canceled' });

		await checkHasPasscode({});

		expect(mockedVerify).toHaveBeenCalledTimes(1);
		expect(mockedDisenrol).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
	});

	it('enrol fails → biometry disabled, no consent prompt', async () => {
		mockedEnrol.mockResolvedValueOnce({ kind: 'error', cause: new Error('keychain') });

		await checkHasPasscode({});

		expect(mockedVerify).not.toHaveBeenCalled();
		expect(mockedDisenrol).not.toHaveBeenCalled();
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
	});
});
