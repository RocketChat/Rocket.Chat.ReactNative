import * as Keychain from 'react-native-keychain';

export type TrustResult =
	| { kind: 'success' }
	| { kind: 'canceled' }
	| { kind: 'enrollmentChanged' }
	| { kind: 'unavailable' }
	| { kind: 'error'; cause: unknown };

export interface IBiometricTrustStore {
	enrol(): Promise<TrustResult>;
	disenrol(): Promise<void>;
	verify(opts: { promptCopy: { title: string; cancel: string } }): Promise<TrustResult>;
	probeExists(): Promise<boolean>;
}

const SENTINEL_SERVICE = 'chat.rocket.reactnative.biometric-trust';
const SENTINEL_USERNAME = 'biometric-trust';
const SENTINEL_VALUE = 'v1';

// BIOMETRY_CURRENT_SET binds the item to the *current* biometric enrolment on both platforms; iOS
// invalidates the keychain entry when the enrolment set changes (errSecItemNotFound on read), and
// Android raises KeyPermanentlyInvalidatedException. That invalidation signal is the security
// primitive this whole module exists for.
const writeOptions = (): Keychain.SetOptions => ({
	service: SENTINEL_SERVICE,
	accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
	accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
});

const readOptions = (promptCopy: { title: string; cancel: string }): Keychain.GetOptions => ({
	service: SENTINEL_SERVICE,
	authenticationPrompt: {
		title: promptCopy.title,
		cancel: promptCopy.cancel
	}
});

// errSecUserCancel — biometric prompt dismissed by the user.
// errSecItemNotFound (-25300) when raised *after* the OS prompt indicates the keychain item was
// invalidated by an enrollment change on iOS.
// KeyPermanentlyInvalidatedException is the Android signal for the same condition.
export const classifyError = (e: unknown): TrustResult => {
	const err = e as { code?: string | number; name?: string; message?: string } | null | undefined;
	const code = err?.code != null ? String(err.code) : '';
	const name = err?.name ?? '';
	const message = err?.message ?? '';
	const blob = `${code} ${name} ${message}`;

	if (/errSecUserCancel|UserCancel|user.?cancel|AuthenticationCanceled|-128\b/i.test(blob)) {
		return { kind: 'canceled' };
	}
	if (/KeyPermanentlyInvalidatedException/i.test(blob)) {
		return { kind: 'enrollmentChanged' };
	}
	if (/errSecItemNotFound|-25300/i.test(blob)) {
		return { kind: 'enrollmentChanged' };
	}
	return { kind: 'error', cause: e };
};

export const biometricTrustStore: IBiometricTrustStore = {
	async enrol() {
		try {
			await Keychain.setGenericPassword(SENTINEL_USERNAME, SENTINEL_VALUE, writeOptions());
			return { kind: 'success' };
		} catch (e) {
			return classifyError(e);
		}
	},

	async disenrol() {
		try {
			await Keychain.resetGenericPassword({ service: SENTINEL_SERVICE });
		} catch {
			// best-effort delete; sentinel may already be absent
		}
	},

	async verify({ promptCopy }) {
		const exists = await biometricTrustStore.probeExists();
		if (!exists) {
			return { kind: 'unavailable' };
		}
		try {
			const result = await Keychain.getGenericPassword(readOptions(promptCopy));
			if (result && result.password === SENTINEL_VALUE) {
				return { kind: 'success' };
			}
			// OS prompt succeeded but the sentinel is gone — treat as enrollment change.
			return { kind: 'enrollmentChanged' };
		} catch (e) {
			return classifyError(e);
		}
	},

	async probeExists() {
		try {
			const result = await Keychain.hasGenericPassword({ service: SENTINEL_SERVICE });
			return !!result;
		} catch {
			return false;
		}
	}
};

export default biometricTrustStore;
