import { useEffect, useRef, useState } from 'react';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { sha256 } from 'js-sha256';

import Base, { type IBase } from './Base';
import Locked from './Base/Locked';
import { TYPE } from './constants';
import { ATTEMPTS_KEY, LOCKED_OUT_TIMER_KEY, MAX_ATTEMPTS, PASSCODE_KEY } from '../../lib/constants/localAuthentication';
import { biometryAuth, resetAttempts } from '../../lib/methods/helpers/localAuthentication';
import { getDiff, getLockedUntil } from './utils';
import UserPreferences, { useUserPreferences } from '../../lib/methods/userPreferences';
import I18n from '../../i18n';

interface IPasscodePasscodeEnter {
	hasBiometry: boolean;
	finishProcess: Function;
}

const PasscodeEnter = ({ hasBiometry, finishProcess }: IPasscodePasscodeEnter) => {
	const ref = useRef<IBase>(null);
	const attempts = parseInt(UserPreferences.getString(ATTEMPTS_KEY) || '0', 10);
	const [passcode] = useUserPreferences(PASSCODE_KEY);
	const [status, setStatus] = useState<TYPE | null>(null);

	const biometry = async () => {
		if (hasBiometry && status === TYPE.ENTER) {
			const result = await biometryAuth();
			if (result?.success) {
				finishProcess();
			}
		}
	};

	const readStorage = async () => {
		const lockedUntil = await getLockedUntil();
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
				const nextAttempts = attempts + 1;
				if (nextAttempts >= MAX_ATTEMPTS) {
					setStatus(TYPE.LOCKED);
					UserPreferences.setString(LOCKED_OUT_TIMER_KEY, new Date().toISOString());
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				} else {
					ref?.current?.wrongPasscode();
					UserPreferences.setString(ATTEMPTS_KEY, nextAttempts.toString());
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
