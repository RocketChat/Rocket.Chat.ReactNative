import React, { useEffect, useRef, useState } from 'react';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { sha256 } from 'js-sha256';

import Base, { type IBase } from './Base';
import Locked from './Base/Locked';
import { TYPE } from './constants';
import { ATTEMPTS_KEY, LOCKED_OUT_TIMER_KEY, MAX_ATTEMPTS, PASSCODE_KEY } from '../../lib/constants/localAuthentication';
import { biometryAuth, resetAttempts } from '../../lib/methods/helpers/localAuthentication';
import { resolveBiometricTrust, type BiometricInvalidationReason } from '../../lib/biometricTrustStore/resolveBiometricTrust';
import { getDiff, getLockedUntil } from './utils';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import I18n from '../../i18n';

interface IPasscodePasscodeEnter {
	hasBiometry: boolean;
	reason?: BiometricInvalidationReason;
	finishProcess: Function;
}

const PasscodeEnter = ({ hasBiometry: initialHasBiometry, reason: initialReason, finishProcess }: IPasscodePasscodeEnter) => {
	const ref = useRef<IBase>(null);
	// Refs, not per-render locals: any state update re-renders the component, and a plain `let`
	// would silently reset the failed-attempts counter mid-session, defeating the MAX_ATTEMPTS lockout.
	const attempts = useRef(0);
	const lockedUntil = useRef<Date | null>(null);
	const [passcode] = useUserPreferences(PASSCODE_KEY);
	const [status, setStatus] = useState<TYPE | null>(null);
	// Mirror hasBiometry/reason locally so an enrollment-change invalidation triggered from the
	// biometry button immediately hides the button within the same modal session, without
	// re-emitting LOCAL_AUTHENTICATE_EMITTER (which would orphan the upstream openModal promise).
	const [hasBiometry, setHasBiometry] = useState<boolean>(initialHasBiometry);
	const [reason, setReason] = useState<BiometricInvalidationReason | undefined>(initialReason);
	const { setItem: setAttempts } = useAsyncStorage(ATTEMPTS_KEY);
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
		lockedUntil.current = await getLockedUntil();
		if (lockedUntil.current) {
			const diff = getDiff(lockedUntil.current);
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
		// Auto-prompt biometry from behind this modal so the app content stays covered during the OS
		// prompt. biometry() no-ops unless hasBiometry and status === ENTER.
		biometry();
	};

	useEffect(() => {
		readStorage();
	}, [status]);

	const onEndProcess = (p: string) => {
		setTimeout(() => {
			if (sha256(p) === passcode) {
				finishProcess();
			} else {
				attempts.current += 1;
				if (attempts.current >= MAX_ATTEMPTS) {
					setStatus(TYPE.LOCKED);
					setLockedUntil(new Date().toISOString());
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				} else {
					ref?.current?.wrongPasscode();
					setAttempts(attempts.current.toString());
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
				}
			}
		}, 200);
	};

	if (status === TYPE.LOCKED) {
		return <Locked setStatus={setStatus} />;
	}

	const subtitle = reason === 'enrollmentChanged' ? I18n.t('Local_authentication_biometric_enrollment_changed') : null;

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
