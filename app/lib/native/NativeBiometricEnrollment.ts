import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import { isIOS } from '../methods/helpers/deviceInfo';

export interface Spec extends TurboModule {
	/** Creates the probe key bound to the current enrollment (idempotent); false when none is available. @platform android */
	enrollProbe(): Promise<boolean>;

	/** Deletes the probe key, kept in lockstep with the JS trust sentinel teardown. @platform android */
	disenrollProbe(): Promise<boolean>;

	/** Silent check (never prompts): false only when an enrollment change invalidated the key. @platform android */
	isEnrollmentValid(): Promise<boolean>;
}

/*
 * There is no iOS counterpart, so the fallback answers for iOS. On Android the module is expected:
 * a missing one must reject rather than answer `false`, which the trust store would read as an
 * enrollment change and permanently disenroll every user on the build.
 */
const missingModule = () => Promise.reject(new Error('BiometricEnrollment native module is unavailable'));

const NativeBiometricEnrollment =
	TurboModuleRegistry.get<Spec>('BiometricEnrollment') ??
	({
		enrollProbe: () => (isIOS ? Promise.resolve(false) : missingModule()),
		disenrollProbe: () => (isIOS ? Promise.resolve(false) : missingModule()),
		isEnrollmentValid: () => (isIOS ? Promise.resolve(true) : missingModule())
	} as Spec);

export default NativeBiometricEnrollment;
