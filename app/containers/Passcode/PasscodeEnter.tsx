import React, { useEffect, useRef, useState } from 'react';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { sha256 } from 'js-sha256';

import Base, { IBase } from './Base';
import Locked from './Base/Locked';
import { TYPE } from './constants';
import { ATTEMPTS_KEY, LOCKED_OUT_TIMER_KEY, MAX_ATTEMPTS, PASSCODE_KEY } from '../../lib/constants';
import { biometryAuth, resetAttempts } from '../../lib/methods/helpers/localAuthentication';
import { getDiff, getLockedUntil } from './utils';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import I18n from '../../i18n';

interface IPasscodePasscodeEnter {
	hasBiometry: boolean;
	finishProcess: Function;
}

const PasscodeEnter = ({ hasBiometry, finishProcess }: IPasscodePasscodeEnter) => {
	const ref = useRef<IBase>(null);
	let attempts = 0;
	let lockedUntil: any = false;
	const [passcode] = useUserPreferences(PASSCODE_KEY);
	const [status, setStatus] = useState<TYPE | null>(null);
	const { setItem: setAttempts } = useAsyncStorage(ATTEMPTS_KEY);
	const { setItem: setLockedUntil } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	const biometry = async () => {
		if (hasBiometry && status === TYPE.ENTER) {
			const result = await biometryAuth();
			if (result?.success) {
				finishProcess();
			}
		}
	};

	const readStorage = async () => {
		lockedUntil = await getLockedUntil();
		if (lockedUntil) {
			const diff = getDiff(lockedUntil);
			if (diff <= 1) {
				await resetAttempts();
				setStatus(TYPE.ENTER);
			} else {
				setStatus(TYPE.LOCKED);
			}
		} else {
			setStatus(TYPE.ENTER);
		}
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
				attempts += 1;
				if (attempts >= MAX_ATTEMPTS) {
					setStatus(TYPE.LOCKED);
					setLockedUntil(new Date().toISOString());
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				} else {
					ref?.current?.wrongPasscode();
					setAttempts(attempts?.toString());
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
				}
			}
		}, 200);
	};

	if (status === TYPE.LOCKED) {
		return <Locked setStatus={setStatus} />;
	}

	return (
		<Base
			ref={ref}
			type={TYPE.ENTER}
			title={I18n.t('Passcode_enter_title')}
			showBiometry={hasBiometry}
			onEndProcess={onEndProcess}
			onBiometryPress={biometry}
		/>
	);
};

export default gestureHandlerRootHOC(PasscodeEnter);
