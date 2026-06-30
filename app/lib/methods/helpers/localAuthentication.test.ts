import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EventEmitter from './events';
import UserPreferences from '../userPreferences';
import database from '../../database';
import { getServerTimeSync } from '../../services/getServerTimeSync';
import { store as reduxStore } from '../../store/auxStore';
import { checkHasPasscode, handleLocalAuthentication, localAuthenticate } from './localAuthentication';
import { biometricTrustStore } from '../../biometricTrustStore';
import { CHANGE_PASSCODE_EMITTER, LOCAL_AUTHENTICATE_EMITTER } from '../../constants/localAuthentication';

jest.mock('@react-native-async-storage/async-storage', () => ({
	multiRemove: jest.fn(() => Promise.resolve())
}));

jest.mock('expo-local-authentication', () => ({
	authenticateAsync: jest.fn(),
	isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
	supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([2])),
	AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 }
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

jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: jest.fn(),
			write: jest.fn(callback => callback())
		}
	}
}));

jest.mock('../../store/auxStore', () => ({ store: { dispatch: jest.fn() } }));
jest.mock('../../services/getServerTimeSync', () => ({ getServerTimeSync: jest.fn(() => Promise.resolve(Date.now())) }));
jest.mock('../../../i18n', () => ({ t: (key: string) => key }));

jest.mock('../../biometricTrustStore', () => ({
	biometricTrustStore: {
		verify: jest.fn(),
		enroll: jest.fn(),
		disenroll: jest.fn(),
		hasEnrollment: jest.fn(),
		isEnrollmentValid: jest.fn(),
		isEnabled: jest.fn(),
		setEnabled: jest.fn(),
		setBiometryEnabled: jest.fn(),
		isRelockPending: jest.fn(),
		setRelockPending: jest.fn()
	}
}));

jest.mock('./events', () => ({
	__esModule: true,
	default: { emit: jest.fn(), addEventListener: jest.fn(), removeListener: jest.fn() }
}));

const mockedEmit = EventEmitter.emit as jest.Mock;
const mockedGetString = UserPreferences.getString as jest.Mock;
const mockedDispatch = reduxStore.dispatch as jest.Mock;
const mockedGetServerTimeSync = getServerTimeSync as jest.Mock;
const mockedServersGet = database.servers.get as unknown as jest.Mock;
const mockedServersWrite = database.servers.write as unknown as jest.Mock;
const mockedMultiRemove = AsyncStorage.multiRemove as jest.Mock;
const mockedVerify = biometricTrustStore.verify as jest.Mock;
const mockedEnroll = biometricTrustStore.enroll as jest.Mock;
const mockedDisenroll = biometricTrustStore.disenroll as jest.Mock;
const mockedSetEnabled = biometricTrustStore.setEnabled as jest.Mock;
const mockedIsEnabled = biometricTrustStore.isEnabled as jest.Mock;
const mockedHasEnrollment = biometricTrustStore.hasEnrollment as jest.Mock;
const mockedIsEnrollmentValid = biometricTrustStore.isEnrollmentValid as jest.Mock;
const mockedIsRelockPending = biometricTrustStore.isRelockPending as jest.Mock;
const mockedSetRelockPending = biometricTrustStore.setRelockPending as jest.Mock;
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
		// Sentinel present by default → no enrollment change. Tests that exercise the invalidation path
		// override this per-case.
		mockedHasEnrollment.mockResolvedValue(true);
		// Enrollment intact by default (Android native probe reports valid). Overridden per-case.
		mockedIsEnrollmentValid.mockResolvedValue(true);
		mockedIsRelockPending.mockReturnValue(false);
		mockedDisenroll.mockResolvedValue(undefined);
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

	it('warm path: biometry enabled but sentinel gone (enrollment changed) → forces passcode, disables biometry, sets reason', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValueOnce(false);

		await handleLocalAuthentication();

		// Modal opens with biometry hidden and the enrollment-changed notice...
		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'enrollmentChanged' });
		// ...trust state torn down (disenroll before clearing the flag), relock marker cleared, no prompt.
		expect(mockedDisenroll).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
		expect(mockedSetRelockPending).toHaveBeenCalledWith(false);
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('Android path: sentinel survives but native probe reports invalidated → forces passcode with reason', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValue(true); // Android keeps the sentinel after an enrollment change
		mockedIsEnrollmentValid.mockResolvedValueOnce(false); // ...but the keystore probe key is invalidated

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'enrollmentChanged' });
		expect(mockedDisenroll).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('cold-launch path: migration already disabled biometry but left relock pending → still forces passcode with reason', async () => {
		// Init migration ran first, reconciled the flag off and persisted the relock marker.
		mockedIsEnabled.mockReturnValue(false);
		mockedIsRelockPending.mockReturnValue(true);

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'enrollmentChanged' });
		// Flag already cleared by the migration, so no disenroll here; the marker is consumed.
		expect(mockedDisenroll).not.toHaveBeenCalled();
		expect(mockedSetRelockPending).toHaveBeenCalledWith(false);
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('biometry disabled → does not probe the sentinel', async () => {
		mockedIsEnabled.mockReturnValue(false);

		await handleLocalAuthentication();

		expect(mockedHasEnrollment).not.toHaveBeenCalled();
	});

	it('biometry enabled with an enrolled unlabeled biometric type → still opens modal with hasBiometry: true', async () => {
		mockedIsEnabled.mockReturnValue(true);
		(LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValueOnce([
			LocalAuthentication.AuthenticationType.IRIS
		]);

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

describe('localAuthenticate', () => {
	const mockedFindServer = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetString.mockReturnValue('stored-passcode');
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValue(false);
		mockedIsEnrollmentValid.mockResolvedValue(true);
		mockedIsRelockPending.mockReturnValue(false);
		mockedIsEnrolled.mockResolvedValue(true);
		mockedDisenroll.mockResolvedValue(undefined);
		mockedGetServerTimeSync.mockResolvedValueOnce(1_000_000).mockResolvedValueOnce(1_000_001);
		mockedServersGet.mockReturnValue({ find: mockedFindServer });
		mockedServersWrite.mockImplementation(callback => callback());
		mockedMultiRemove.mockResolvedValue(undefined);
		mockedEmit.mockImplementation((event, payload) => {
			if (event === LOCAL_AUTHENTICATE_EMITTER && payload?.submit) {
				setImmediate(() => payload.submit());
			}
		});
	});

	it('enrollmentChanged forces the passcode modal inside the auto-lock window', async () => {
		const serverRecord = {
			autoLock: true,
			autoLockTime: 60,
			lastLocalAuthenticatedSession: new Date(990_000),
			update: jest.fn(updater => {
				updater(serverRecord);
				return Promise.resolve();
			})
		};
		mockedFindServer.mockResolvedValue(serverRecord);

		await localAuthenticate('server-id');

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'enrollmentChanged' });
		expect(mockedGetServerTimeSync).toHaveBeenCalledTimes(2);
		expect(mockedDispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ isLocalAuthenticated: false }));
		expect(mockedDispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ isLocalAuthenticated: true }));
	});
});

// First-passcode setup must keep biometry opt-in: enroll writes the sentinel silently, then a single
// verify() prompt asks for consent. Declining tears the sentinel back down and leaves biometry off.
describe('checkHasPasscode → biometry consent on first passcode', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedDisenroll.mockResolvedValue(undefined);
		// No stored passcode → checkHasPasscode runs changePasscode then checkBiometry.
		(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
		mockedEmit.mockImplementation((event, payload) => {
			if (event === CHANGE_PASSCODE_EMITTER && payload?.submit) {
				setImmediate(() => payload.submit('1234'));
			}
		});
	});

	it('enroll succeeds and user consents → prompts once, biometry enabled, no disenroll', async () => {
		mockedEnroll.mockResolvedValueOnce({ kind: 'success' });
		mockedVerify.mockResolvedValueOnce({ kind: 'success' });

		await checkHasPasscode({});

		expect(mockedEnroll).toHaveBeenCalledTimes(1);
		expect(mockedVerify).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(true);
		expect(mockedDisenroll).not.toHaveBeenCalled();
	});

	it("user declines consent ('Don't activate') → disenrolls and leaves biometry disabled", async () => {
		mockedEnroll.mockResolvedValueOnce({ kind: 'success' });
		mockedVerify.mockResolvedValueOnce({ kind: 'canceled' });

		await checkHasPasscode({});

		expect(mockedVerify).toHaveBeenCalledTimes(1);
		expect(mockedDisenroll).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
	});

	it('enroll fails → biometry disabled, no consent prompt', async () => {
		mockedEnroll.mockResolvedValueOnce({ kind: 'error', cause: new Error('keychain') });

		await checkHasPasscode({});

		expect(mockedVerify).not.toHaveBeenCalled();
		expect(mockedDisenroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
	});
});
