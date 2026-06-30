import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	/**
	 * Creates the probe key bound to the current biometric enrollment (idempotent).
	 * Resolves false when no enrollment/secure lock screen is available.
	 * @platform android
	 */
	enrollProbe(): Promise<boolean>;

	/**
	 * Deletes the probe key, kept in lockstep with the JS trust sentinel teardown.
	 * @platform android
	 */
	disenrollProbe(): Promise<boolean>;

	/**
	 * Silent check. Resolves true when the current enrollment still matches the probe key
	 * (or a fresh baseline was just created), false only when the key was invalidated by an
	 * enrollment change. Never shows a biometric prompt.
	 * @platform android
	 */
	isEnrollmentValid(): Promise<boolean>;
}

// On iOS there is no native counterpart (the BIOMETRY_CURRENT_SET sentinel surfaces enrollment
// changes for free), so TurboModuleRegistry.get returns null and these fall back to safe no-ops
// that report "valid" — matching the legacy NativeModules.BiometricEnrollment === undefined path.
const NativeBiometricEnrollment =
	TurboModuleRegistry.get<Spec>('BiometricEnrollment') ??
	({
		enrollProbe: () => Promise.resolve(false),
		disenrollProbe: () => Promise.resolve(false),
		isEnrollmentValid: () => Promise.resolve(true)
	} as Spec);

export default NativeBiometricEnrollment;
