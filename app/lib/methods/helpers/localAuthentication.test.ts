import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EventEmitter from './events';
import UserPreferences from '../userPreferences';
import database from '../../database';
import { getServerTimeSync } from '../../services/getServerTimeSync';
import { store as reduxStore } from '../../store/auxStore';
import {
	biometryAuth,
	checkHasPasscode,
	enableBiometry,
	handleLocalAuthentication,
	localAuthenticate
} from './localAuthentication';
import { biometricTrustStore } from '../../biometricTrustStore';
import { CHANGE_PASSCODE_EMITTER, LOCAL_AUTHENTICATE_EMITTER } from '../../constants/localAuthentication';

jest.mock('@react-native-async-storage/async-storage', () => ({
	multiRemove: jest.fn(() => Promise.resolve())
}));

jest.mock('expo-local-authentication', () => ({
	authenticateAsync: jest.fn(),
	isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
	getEnrolledLevelAsync: jest.fn(() => Promise.resolve(3)),
	supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([2])),
	AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
	SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 }
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
		setRelockPending: jest.fn(),
		invalidate: jest.fn()
	}
}));

jest.mock('./events', () => ({
	__esModule: true,
	default: { emit: jest.fn(), addEventListener: jest.fn(), removeListener: jest.fn() }
}));

// biometryAuth branches on platform (verify() proves presence on iOS only), so the flag has to be
// switchable per test. A getter keeps it live — the module reads `isIOS` at call time, not import time.
let mockIsIOS = true;
jest.mock('./deviceInfo', () => ({
	get isIOS() {
		return mockIsIOS;
	},
	get isAndroid() {
		return !mockIsIOS;
	}
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
const mockedInvalidate = biometricTrustStore.invalidate as jest.Mock;
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
		mockedInvalidate.mockResolvedValue(undefined);
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

	it('warm path: biometry enabled but sentinel gone → forces passcode, disables biometry, sets a neutral reason', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValueOnce(false);

		await handleLocalAuthentication();

		// Modal opens with biometry hidden and a notice...
		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'trustLost' });
		// ...trust state torn down, and the relock debt cleared once the passcode came back.
		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(mockedSetRelockPending).toHaveBeenCalledWith(false);
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('Android path: sentinel survives but native probe reports invalidated → forces passcode with reason', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValue(true); // Android keeps the sentinel after an enrollment change
		mockedIsEnrollmentValid.mockResolvedValueOnce(false); // ...but the keystore probe key is invalidated

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'enrollmentChanged' });
		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	/*
	 * A check that could not complete says nothing about the enrollment, so it must fail closed
	 * (passcode, no biometry button) without failing destructive: invalidate() is irreversible and
	 * would silently revoke an opted-in feature over a busy sensor or a one-off keychain error.
	 */
	it.each([
		[
			'hasEnrollment() rejects (keychain error)',
			() => {
				mockedHasEnrollment.mockRejectedValueOnce(new Error('keychain read failed'));
			}
		],
		[
			'isEnrollmentValid() rejects (broken bridge)',
			() => {
				mockedHasEnrollment.mockResolvedValue(true);
				mockedIsEnrollmentValid.mockRejectedValueOnce(new Error('probe bridge failed'));
			}
		]
	])('fail closed, not destructive: %s → forces passcode and keeps the enrollment', async (_label, arrange) => {
		mockedIsEnabled.mockReturnValue(true);
		arrange();

		await handleLocalAuthentication();

		// No `reason`: this is not an enrollment change, and the copy must not claim it was.
		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false });
		expect(lastEmitPayload()?.reason).toBeUndefined();
		expect(mockedInvalidate).not.toHaveBeenCalled();
		expect(mockedDisenroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).not.toHaveBeenCalled();
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('grandfather relock: enrollment intact with a debt outstanding → forces passcode, neutral reason', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedIsRelockPending.mockReturnValue(true);

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'relockRequired' });
		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(mockedSetRelockPending).toHaveBeenLastCalledWith(false);
	});

	// The marker is the only thing that survives the process, so a persistent failure must not clear it.
	it('leaves a pending relock marker set when the check fails', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedIsRelockPending.mockReturnValue(true);
		mockedHasEnrollment.mockRejectedValueOnce(new Error('keychain read failed'));

		await handleLocalAuthentication();

		expect(mockedSetRelockPending).not.toHaveBeenCalledWith(false);
	});

	it('cold-launch path: migration already disabled biometry but left relock pending → still forces passcode with reason', async () => {
		// Init migration ran first, reconciled the flag off and persisted the relock marker.
		mockedIsEnabled.mockReturnValue(false);
		mockedIsRelockPending.mockReturnValue(true);

		await handleLocalAuthentication();

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'trustLost' });
		// Flag already cleared by the migration, so no teardown here.
		expect(mockedInvalidate).not.toHaveBeenCalled();
		expect(mockedSetRelockPending).toHaveBeenNthCalledWith(1, true);
		expect(mockedSetRelockPending).toHaveBeenNthCalledWith(2, false);
		expect(mockedVerify).not.toHaveBeenCalled();
	});

	it('kill-before-passcode: modal never resolves → relock debt is persisted and NOT cleared', async () => {
		mockedIsEnabled.mockReturnValue(true);
		mockedHasEnrollment.mockResolvedValueOnce(false);
		mockedEmit.mockImplementation(() => {});

		let settled = false;
		handleLocalAuthentication().then(
			() => {
				settled = true;
			},
			() => {
				settled = true;
			}
		);
		await new Promise(resolve => setImmediate(resolve));

		expect(settled).toBe(false);
		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'trustLost' });
		// invalidate() arms the debt (see biometricTrustStore/index.test.ts); what matters here is that
		// nothing clears it while the modal is still up.
		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(mockedSetRelockPending).not.toHaveBeenCalledWith(false);
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
		mockedInvalidate.mockResolvedValue(undefined);
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

	it('a lost enrollment forces the passcode modal inside the auto-lock window', async () => {
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

		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false, reason: 'trustLost' });
		expect(mockedGetServerTimeSync).toHaveBeenCalledTimes(2);
		expect(mockedDispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ isLocalAuthenticated: false }));
		expect(mockedDispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ isLocalAuthenticated: true }));
	});

	it('fail closed on warm resume: hasEnrollment() rejects inside the auto-lock window → forces passcode, keeps biometry', async () => {
		mockedHasEnrollment.mockReset();
		mockedHasEnrollment.mockRejectedValue(new Error('keychain read failed'));
		const serverRecord = {
			autoLock: true,
			autoLockTime: 60,
			// Well within the auto-lock window: without fail-closed detection the session would stay unlocked.
			lastLocalAuthenticatedSession: new Date(999_999),
			update: jest.fn(updater => {
				updater(serverRecord);
				return Promise.resolve();
			})
		};
		mockedFindServer.mockResolvedValue(serverRecord);

		await expect(localAuthenticate('server-id')).resolves.toBeUndefined();

		// Still forced despite the fresh session, but the enrollment survives a transient read failure.
		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false });
		expect(lastEmitPayload()?.reason).toBeUndefined();
		expect(mockedInvalidate).not.toHaveBeenCalled();
	});
});

// First-passcode setup must keep biometry opt-in: enroll writes the sentinel silently, then a single
// verify() prompt asks for consent. Declining tears the sentinel back down and leaves biometry off.
describe('checkHasPasscode → biometry consent on first passcode', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedDisenroll.mockResolvedValue(undefined);
		// No stored passcode → checkHasPasscode runs changePasscode then checkBiometry. clearAllMocks()
		// does not reset implementations, so explicitly clear the 'stored-passcode' return leaked from the
		// localAuthenticate block above (otherwise checkHasPasscode early-returns and never enrolls).
		mockedGetString.mockReturnValue(undefined);
		(LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
		(LocalAuthentication.getEnrolledLevelAsync as jest.Mock).mockResolvedValue(3);
		mockedEmit.mockImplementation((event, payload) => {
			if (event === CHANGE_PASSCODE_EMITTER && payload?.submit) {
				setImmediate(() => payload.submit('1234'));
			}
		});
	});

	// Class 2 face unlock passes isEnrolledAsync but the keystore can't bind a user-auth key to it, so
	// enrolling would only produce a sentinel we'd immediately have to revoke.
	it('weak-only biometry → never enrolls, never prompts, biometry left disabled', async () => {
		(LocalAuthentication.getEnrolledLevelAsync as jest.Mock).mockResolvedValue(2);

		await checkHasPasscode({});

		expect(mockedEnroll).not.toHaveBeenCalled();
		expect(mockedVerify).not.toHaveBeenCalled();
		expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
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
		// Cleans up before clearing the flag, so a partial enroll can't orphan a sentinel.
		expect(mockedDisenroll).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
		expect(mockedDisenroll.mock.invocationCallOrder[0]).toBeLessThan(mockedSetEnabled.mock.invocationCallOrder[0]);
	});
});

// biometryAuth must prove a live user is present, not merely that the biometric enrollment is
// unchanged. On iOS the sentinel read does both. On Android it does not: react-native-keychain builds
// the sentinel's keystore key with setUserAuthenticationParameters(5, AUTH_BIOMETRIC_STRONG or
// AUTH_DEVICE_CREDENTIAL) and only shows the BiometricPrompt from decrypt()'s
// UserNotAuthenticatedException branch, so within 5s of a *PIN* unlock verify() resolves success with
// no prompt at all. These tests pin the platform split that closes that hole.
const mockedAuthenticateAsync = LocalAuthentication.authenticateAsync as jest.Mock;

describe('biometryAuth', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsIOS = true;
		mockedHasEnrollment.mockResolvedValue(true);
		mockedIsEnrollmentValid.mockResolvedValue(true);
	});

	describe('iOS', () => {
		it('delegates to verify() — the keychain read is itself the biometric evaluation', async () => {
			mockedVerify.mockResolvedValueOnce({ kind: 'success' });

			await expect(biometryAuth()).resolves.toEqual({ kind: 'success' });

			expect(mockedVerify).toHaveBeenCalledTimes(1);
			expect(mockedVerify).toHaveBeenCalledWith({
				promptCopy: { title: 'Local_authentication_biometry_title', cancel: 'Local_authentication_biometry_fallback' }
			});
			// No second prompt: iOS gets presence for free from the same read.
			expect(mockedAuthenticateAsync).not.toHaveBeenCalled();
		});

		it('uses the "Don\'t activate" cancel label when force is set', async () => {
			mockedVerify.mockResolvedValueOnce({ kind: 'success' });

			await biometryAuth(true);

			expect(mockedVerify).toHaveBeenCalledWith({
				promptCopy: { title: 'Local_authentication_biometry_title', cancel: 'Dont_activate' }
			});
		});

		it('passes a non-success verify() kind straight through', async () => {
			mockedVerify.mockResolvedValueOnce({ kind: 'enrollmentChanged' });

			await expect(biometryAuth()).resolves.toEqual({ kind: 'enrollmentChanged' });
		});
	});

	describe('Android', () => {
		beforeEach(() => {
			mockIsIOS = false;
		});

		it('never reads the sentinel for presence — demands a fresh biometric instead', async () => {
			mockedAuthenticateAsync.mockResolvedValueOnce({ success: true });

			await expect(biometryAuth()).resolves.toEqual({ kind: 'success' });

			// The regression this guards: verify() can succeed with no prompt shown, so it must not be
			// what gates the unlock on Android.
			expect(mockedVerify).not.toHaveBeenCalled();
			expect(mockedAuthenticateAsync).toHaveBeenCalledTimes(1);
			// disableDeviceFallback is the whole point: a device PIN must not satisfy this. 'strong' is the
			// other half — expo defaults to 'weak', which would accept a Class 2 face neither the probe key
			// nor the sentinel can see.
			expect(mockedAuthenticateAsync).toHaveBeenCalledWith({
				disableDeviceFallback: true,
				biometricsSecurityLevel: 'strong',
				promptMessage: 'Local_authentication_biometry_title',
				cancelLabel: 'Local_authentication_biometry_fallback'
			});
		});

		it('does not unlock when the biometric prompt fails, even though the sentinel is intact', async () => {
			mockedAuthenticateAsync.mockResolvedValueOnce({ success: false, error: 'user_cancel' });

			await expect(biometryAuth()).resolves.toEqual({ kind: 'canceled' });
		});

		it('reports unavailable without prompting when no sentinel exists', async () => {
			mockedHasEnrollment.mockResolvedValueOnce(false);

			await expect(biometryAuth()).resolves.toEqual({ kind: 'unavailable' });

			expect(mockedIsEnrollmentValid).not.toHaveBeenCalled();
			expect(mockedAuthenticateAsync).not.toHaveBeenCalled();
		});

		it('reports enrollmentChanged from the silent probe without prompting', async () => {
			mockedIsEnrollmentValid.mockResolvedValueOnce(false);

			await expect(biometryAuth()).resolves.toEqual({ kind: 'enrollmentChanged' });

			expect(mockedAuthenticateAsync).not.toHaveBeenCalled();
		});

		it('checks the enrollment binding before prompting, not after', async () => {
			mockedAuthenticateAsync.mockResolvedValueOnce({ success: true });

			await biometryAuth();

			expect(mockedIsEnrollmentValid.mock.invocationCallOrder[0]).toBeLessThan(
				mockedAuthenticateAsync.mock.invocationCallOrder[0]
			);
		});

		it('maps a removed biometric enrollment to unavailable so trust is torn down', async () => {
			mockedAuthenticateAsync.mockResolvedValueOnce({ success: false, error: 'not_enrolled' });

			await expect(biometryAuth()).resolves.toEqual({ kind: 'unavailable' });
		});

		it('maps a lockout to error rather than a user cancel', async () => {
			mockedAuthenticateAsync.mockResolvedValueOnce({ success: false, error: 'lockout' });

			await expect(biometryAuth()).resolves.toEqual({ kind: 'error', cause: 'lockout' });
		});

		// expo flattens the transient ERROR_HW_UNAVAILABLE into 'not_available' together with
		// ERROR_NO_BIOMETRICS, and `unavailable` would permanently tear the enrollment down.
		it('maps an unavailable sensor to error, not to a teardown', async () => {
			mockedAuthenticateAsync.mockResolvedValueOnce({ success: false, error: 'not_available' });

			await expect(biometryAuth()).resolves.toEqual({ kind: 'error', cause: 'not_available' });
		});

		it('fails closed when the sentinel check throws', async () => {
			const cause = new Error('keystore unavailable');
			mockedHasEnrollment.mockRejectedValueOnce(cause);

			await expect(biometryAuth()).resolves.toEqual({ kind: 'error', cause });

			expect(mockedAuthenticateAsync).not.toHaveBeenCalled();
		});

		it('fails closed when the OS prompt throws', async () => {
			const cause = new Error('no activity');
			mockedAuthenticateAsync.mockRejectedValueOnce(cause);

			await expect(biometryAuth()).resolves.toEqual({ kind: 'error', cause });
		});
	});
});

// Consent is only consent if a prompt actually appeared. On Android a bare verify() can resolve inside
// the keystore's 5s auth window with nothing shown, which would enable biometric unlock the user was
// never asked about — so enableBiometry captures consent through biometryAuth(true).
describe('checkHasPasscode → biometry consent on Android', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsIOS = false;
		mockedDisenroll.mockResolvedValue(undefined);
		mockedGetString.mockReturnValue(undefined);
		mockedHasEnrollment.mockResolvedValue(true);
		mockedIsEnrollmentValid.mockResolvedValue(true);
		mockedIsEnrolled.mockResolvedValue(true);
		mockedEmit.mockImplementation((event, payload) => {
			if (event === CHANGE_PASSCODE_EMITTER && payload?.submit) {
				setImmediate(() => payload.submit('1234'));
			}
		});
	});

	afterEach(() => {
		mockIsIOS = true;
	});

	it('asks with a real OS prompt, not a sentinel read', async () => {
		mockedEnroll.mockResolvedValueOnce({ kind: 'success' });
		mockedAuthenticateAsync.mockResolvedValueOnce({ success: true });

		await checkHasPasscode({});

		expect(mockedVerify).not.toHaveBeenCalled();
		expect(mockedAuthenticateAsync).toHaveBeenCalledTimes(1);
		expect(mockedAuthenticateAsync).toHaveBeenCalledWith(expect.objectContaining({ cancelLabel: 'Dont_activate' }));
		expect(mockedSetEnabled).toHaveBeenCalledWith(true);
		expect(mockedDisenroll).not.toHaveBeenCalled();
	});

	it('declining the prompt disenrolls and leaves biometry disabled', async () => {
		mockedEnroll.mockResolvedValueOnce({ kind: 'success' });
		mockedAuthenticateAsync.mockResolvedValueOnce({ success: false, error: 'user_cancel' });

		await checkHasPasscode({});

		expect(mockedDisenroll).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
	});
});

// Every enable path shares this one, including the settings toggle the grandfathered cohort re-enables
// from — a silent re-bind there would hand trust back to whatever enrollment is on the device now.
describe('enableBiometry', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsIOS = false;
		mockedDisenroll.mockResolvedValue(undefined);
		mockedHasEnrollment.mockResolvedValue(true);
		mockedIsEnrollmentValid.mockResolvedValue(true);
		mockedIsEnrolled.mockResolvedValue(true);
	});

	afterEach(() => {
		mockIsIOS = true;
	});

	it('prompts for consent after binding the sentinel', async () => {
		mockedEnroll.mockResolvedValueOnce({ kind: 'success' });
		mockedAuthenticateAsync.mockResolvedValueOnce({ success: true });

		await expect(enableBiometry()).resolves.toEqual({ kind: 'success' });

		expect(mockedEnroll).toHaveBeenCalledTimes(1);
		expect(mockedAuthenticateAsync).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(true);
		expect(mockedDisenroll).not.toHaveBeenCalled();
	});

	it('tears the fresh sentinel back down when consent is declined', async () => {
		mockedEnroll.mockResolvedValueOnce({ kind: 'success' });
		mockedAuthenticateAsync.mockResolvedValueOnce({ success: false, error: 'user_cancel' });

		await expect(enableBiometry()).resolves.toEqual({ kind: 'canceled' });

		expect(mockedDisenroll).toHaveBeenCalledTimes(1);
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
		expect(mockedSetEnabled).not.toHaveBeenCalledWith(true);
	});

	it('refuses without a strong biometric, before writing anything', async () => {
		mockedIsEnrolled.mockResolvedValueOnce(false);

		await expect(enableBiometry()).resolves.toEqual({ kind: 'unavailable' });

		expect(mockedEnroll).not.toHaveBeenCalled();
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
	});

	it('surfaces an enroll failure without prompting', async () => {
		mockedEnroll.mockResolvedValueOnce({ kind: 'unavailable' });

		await expect(enableBiometry()).resolves.toEqual({ kind: 'unavailable' });

		expect(mockedAuthenticateAsync).not.toHaveBeenCalled();
		expect(mockedSetEnabled).toHaveBeenCalledWith(false);
	});
});

describe('handleLocalAuthentication relockReason option', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedIsEnabled.mockReturnValue(true);
		mockedIsEnrolled.mockResolvedValue(true);
		mockedHasEnrollment.mockResolvedValue(true);
		mockedIsEnrollmentValid.mockResolvedValue(true);
		mockedIsRelockPending.mockReturnValue(false);
		mockedEmit.mockImplementation((event, payload) => {
			if (event === LOCAL_AUTHENTICATE_EMITTER && payload?.submit) {
				setImmediate(() => payload.submit());
			}
		});
	});

	it("trusts an explicit 'none' instead of re-running the check", async () => {
		await handleLocalAuthentication({ relockReason: 'none' });

		expect(mockedHasEnrollment).not.toHaveBeenCalled();
		expect(mockedIsEnrollmentValid).not.toHaveBeenCalled();
		expect(mockedIsRelockPending).not.toHaveBeenCalled();
		expect(lastEmitPayload()?.reason).toBeUndefined();
	});

	it('still computes the check when the option is omitted', async () => {
		await handleLocalAuthentication();

		expect(mockedHasEnrollment).toHaveBeenCalled();
	});

	it("forces the enrollment-changed unlock when passed 'enrollmentChanged'", async () => {
		mockedInvalidate.mockResolvedValueOnce(undefined);

		await handleLocalAuthentication({ relockReason: 'enrollmentChanged' });

		expect(mockedInvalidate).toHaveBeenCalledTimes(1);
		expect(lastEmitPayload()?.reason).toBe('enrollmentChanged');
		expect(mockedSetRelockPending).toHaveBeenLastCalledWith(false);
	});

	it.each(['trustLost', 'relockRequired'] as const)(
		"forces the enrollment-changed teardown when passed '%s', with that reason's own copy",
		async relockReason => {
			mockedInvalidate.mockResolvedValueOnce(undefined);

			await handleLocalAuthentication({ relockReason });

			expect(mockedInvalidate).toHaveBeenCalledTimes(1);
			expect(lastEmitPayload()?.reason).toBe(relockReason);
			expect(mockedSetRelockPending).toHaveBeenLastCalledWith(false);
		}
	);

	it("forces the passcode without a teardown when passed 'checkFailed'", async () => {
		await handleLocalAuthentication({ relockReason: 'checkFailed' });

		expect(mockedHasEnrollment).not.toHaveBeenCalled();
		expect(lastEmitPayload()).toMatchObject({ hasBiometry: false });
		expect(lastEmitPayload()?.reason).toBeUndefined();
		expect(mockedInvalidate).not.toHaveBeenCalled();
	});
});
