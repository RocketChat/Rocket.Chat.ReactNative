import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	/** Creates the probe key bound to the current enrollment (idempotent); false when none is available. @platform android */
	enrollProbe(): Promise<boolean>;

	/** Deletes the probe key, kept in lockstep with the JS trust sentinel teardown. @platform android */
	disenrollProbe(): Promise<boolean>;

	/** Silent check (never prompts): false only when an enrollment change invalidated the key. @platform android */
	isEnrollmentValid(): Promise<boolean>;
}

// No iOS counterpart, so the fallback resolves true there; on Android a missing module fails closed.
const NativeBiometricEnrollment =
	TurboModuleRegistry.get<Spec>('BiometricEnrollment') ??
	({
		enrollProbe: () => Promise.resolve(false),
		disenrollProbe: () => Promise.resolve(false),
		isEnrollmentValid: () => Promise.resolve(Platform.OS === 'ios')
	} as Spec);

export default NativeBiometricEnrollment;
