import { useEffect, useRef, useState } from 'react';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { sha256 } from 'js-sha256';

import Base, { type IBase } from './Base';
import Locked from './Base/Locked';
import { TYPE } from './constants';
import { ATTEMPTS_KEY, LOCKED_OUT_TIMER_KEY, MAX_ATTEMPTS, PASSCODE_KEY } from '../../lib/constants/localAuthentication';
import { biometryAuth, resetAttempts } from '../../lib/methods/helpers/localAuthentication';
import log from '../../lib/methods/helpers/log';
import { resolveBiometricTrust } from '../../lib/biometricTrustStore/resolveBiometricTrust';
import { type BiometricInvalidationReason } from '../../definitions';
import { getDiff, getLockedUntil } from './utils';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import I18n from '../../i18n';

const SUBTITLE_KEYS: Record<BiometricInvalidationReason, string> = {
	enrollmentChanged: 'Local_authentication_biometric_enrollment_changed',
	trustLost: 'Local_authentication_biometric_trust_lost',
	relockRequired: 'Local_authentication_biometric_relock_required'
};

interface IPasscodePasscodeEnter {
	hasBiometry: boolean;
	reason?: BiometricInvalidationReason;
	finishProcess: Function;
}

const PasscodeEnter = ({ hasBiometry: initialHasBiometry, reason: initialReason, finishProcess }: IPasscodePasscodeEnter) => {
	const ref = useRef<IBase>(null);
	const attempts = useRef(0);
	const [passcode] = useUserPreferences(PASSCODE_KEY);
	const [status, setStatus] = useState<TYPE | null>(null);
	// Mirrored locally so an invalidation hides the biometry button within the same modal session.
	const [hasBiometry, setHasBiometry] = useState<boolean>(initialHasBiometry);
	const [reason, setReason] = useState<BiometricInvalidationReason | undefined>(initialReason);
	const { getItem: getAttempts, setItem: setAttempts } = useAsyncStorage(ATTEMPTS_KEY);
	const { setItem: setLockedUntil } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	const biometry = async () => {
		if (!hasBiometry || status !== TYPE.ENTER) {
			return;
		}
		const result = await biometryAuth();
		const outcome = await resolveBiometricTrust(result);
		if (outcome.unlocked) {
			finishProcess();
			return;
		}
		const { modal } = outcome;
		setHasBiometry(modal.hasBiometry);
		setReason(modal.reason);
	};

	const readStorage = async () => {
		// Seed from storage so a remount mid-session doesn't grant a fresh attempt budget.
		const storedAttempts = await getAttempts();
		attempts.current = storedAttempts ? parseInt(storedAttempts, 10) : 0;
		const lockedUntil = await getLockedUntil();
		if (lockedUntil) {
			const diff = getDiff(lockedUntil);
			if (diff <= 1) {
				await resetAttempts();
				attempts.current = 0;
				setStatus(TYPE.ENTER);
			} else {
				setStatus(TYPE.LOCKED);
			}
		} else {
			setStatus(TYPE.ENTER);
		}
		// Auto-prompt from behind this modal so app content stays covered during the OS prompt.
		biometry();
	};

	useEffect(() => {
		readStorage();
	}, [status]);

	const onEndProcess = (p: string) => {
		setTimeout(async () => {
			if (sha256(p) === passcode) {
				finishProcess();
				return;
			}
			attempts.current += 1;
			const locked = attempts.current >= MAX_ATTEMPTS;
			try {
				// Every failure, the lockout-triggering one included: readStorage re-seeds the counter from
				// here, so a count that stopped at MAX_ATTEMPTS - 1 would grant a remount an extra attempt.
				await setAttempts(attempts.current.toString());
				if (locked) {
					// Awaited before the status flip, which mounts Locked and has it read this timer back.
					await setLockedUntil(new Date().toISOString());
				}
			} catch (e) {
				log(e);
			}
			if (locked) {
				setStatus(TYPE.LOCKED);
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			} else {
				ref?.current?.wrongPasscode();
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
			}
		}, 200);
	};

	if (status === TYPE.LOCKED) {
		return <Locked setStatus={setStatus} />;
	}

	const subtitle = reason ? I18n.t(SUBTITLE_KEYS[reason]) : null;

	return (
		<Base
			ref={ref}
			type={TYPE.ENTER}
			title={I18n.t('Passcode_enter_title')}
			subtitle={subtitle}
			showBiometry={hasBiometry}
			onEndProcess={onEndProcess}
			onBiometryPress={biometry}
		/>
	);
};

export default gestureHandlerRootHOC(PasscodeEnter);
