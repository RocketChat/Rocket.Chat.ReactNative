import React, { useEffect, useRef, useState } from 'react';
import { useAsyncStorage } from '@react-native-community/async-storage';
import PropTypes from 'prop-types';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { sha256 } from 'js-sha256';

import Base from './Base';
import Locked from './Base/Locked';
import { TYPE } from './constants';
import {
	ATTEMPTS_KEY, LOCKED_OUT_TIMER_KEY, PASSCODE_KEY, MAX_ATTEMPTS
} from '../../constants/localAuthentication';
import { resetAttempts, biometryAuth } from '../../utils/localAuthentication';
import { getLockedUntil, getDiff } from './utils';
import UserPreferences from '../../lib/userPreferences';
import I18n from '../../i18n';

const PasscodeEnter = ({ theme, hasBiometry, finishProcess }) => {
	const ref = useRef(null);
	let attempts = 0;
	let lockedUntil = false;
	const [passcode, setPasscode] = useState(null);
	const [status, setStatus] = useState(null);
	const { getItem: getAttempts, setItem: setAttempts } = useAsyncStorage(ATTEMPTS_KEY);
	const { setItem: setLockedUntil } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	const fetchPasscode = async() => {
		const p = await UserPreferences.getStringAsync(PASSCODE_KEY);
		setPasscode(p);
	};

	const biometry = async() => {
		if (hasBiometry && status === TYPE.ENTER) {
			const result = await biometryAuth();
			if (result?.success) {
				finishProcess();
			}
		}
	};

	const readStorage = async() => {
		lockedUntil = await getLockedUntil();
		if (lockedUntil) {
			const diff = getDiff(lockedUntil);
			if (diff <= 1) {
				await resetAttempts();
				setStatus(TYPE.ENTER);
			} else {
				attempts = await getAttempts();
				setStatus(TYPE.LOCKED);
			}
		} else {
			setStatus(TYPE.ENTER);
		}
		await fetchPasscode();
		biometry();
	};

	useEffect(() => {
		readStorage();
	}, [status]);

	const onEndProcess = (p) => {
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
					ref.current.wrongPasscode();
					setAttempts(attempts?.toString());
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
				}
			}
		}, 200);
	};

	if (status === TYPE.LOCKED) {
		return <Locked theme={theme} setStatus={setStatus} />;
	}

	return (
		<Base
			ref={ref}
			theme={theme}
			type={TYPE.ENTER}
			title={I18n.t('Passcode_enter_title')}
			showBiometry={hasBiometry}
			onEndProcess={onEndProcess}
			onBiometryPress={biometry}
		/>
	);
};

PasscodeEnter.propTypes = {
	theme: PropTypes.string,
	hasBiometry: PropTypes.string,
	finishProcess: PropTypes.func
};

export default gestureHandlerRootHOC(PasscodeEnter);
