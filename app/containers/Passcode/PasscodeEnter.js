import React, { useEffect, useRef, useState } from 'react';
import { useAsyncStorage } from '@react-native-community/async-storage';
import RNUserDefaults from 'rn-user-defaults';
import PropTypes from 'prop-types';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { sha256 } from 'js-sha256';

import Base from './Base';
import Locked from './Locked';
import { TYPE } from './constants';
import {
	ATTEMPTS_KEY, LOCKED_OUT_TIMER_KEY, PASSCODE_KEY, MAX_ATTEMPTS
} from '../../constants/localAuthentication';
import { resetAttempts } from '../../utils/localAuthentication';
import { getLockedUntil, getDiff } from './utils';
import I18n from '../../i18n';

const PasscodeEnter = ({ theme, finishProcess }) => {
	const ref = useRef(null);
	let attempts = 0;
	let lockedUntil = false;
	const [passcode, setPasscode] = useState(null);
	const [status, setStatus] = useState(TYPE.ENTER);
	const [hasBiometry, setHasBiometry] = useState(false);
	const { getItem: getAttempts, setItem: setAttempts } = useAsyncStorage(ATTEMPTS_KEY);
	const { setItem: setLockedUntil } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	const fetchPasscode = async() => {
		const p = await RNUserDefaults.get(PASSCODE_KEY);
		setPasscode(p);
	};

	const readStorage = async() => {
		lockedUntil = await getLockedUntil();
		if (lockedUntil) {
			const diff = getDiff(lockedUntil);
			if (diff <= 1) {
				resetAttempts();
			} else {
				attempts = await getAttempts();
				setStatus(TYPE.LOCKED);
			}
		}
		fetchPasscode();
	};

	const checkBiometry = async() => {
		const b = await LocalAuthentication.isEnrolledAsync();
		setHasBiometry(b);
	};

	const biometry = async() => {
		const result = await LocalAuthentication.authenticateAsync({
			disableDeviceFallback: true,
			cancelLabel: I18n.t('Local_authentication_biometry_fallback'),
			promptMessage: I18n.t('Local_authentication_biometry_title')
		});
		if (result?.success) {
			finishProcess();
		}
	};

	useEffect(() => {
		readStorage();
		checkBiometry();
		biometry();
	}, []);

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
	finishProcess: PropTypes.func
};

export default gestureHandlerRootHOC(PasscodeEnter);
