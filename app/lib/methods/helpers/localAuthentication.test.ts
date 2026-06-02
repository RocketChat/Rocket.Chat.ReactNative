import * as LocalAuthentication from 'expo-local-authentication';

import EventEmitter from './events';
import { handleLocalAuthentication } from './localAuthentication';
import { biometricTrustStore } from '../../biometricTrustStore';
import { LOCAL_AUTHENTICATE_EMITTER } from '../../constants/localAuthentication';

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
