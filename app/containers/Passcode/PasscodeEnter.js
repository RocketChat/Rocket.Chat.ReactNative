import React, { useEffect, useRef, useState } from 'react';
import { useAsyncStorage } from '@react-native-community/async-storage';
import RNUserDefaults from 'rn-user-defaults';
import PropTypes from 'prop-types';

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
	let passcode = null;
	const [status, setStatus] = useState(TYPE.ENTER);
	const { getItem: getAttempts, setItem: setAttempts } = useAsyncStorage(ATTEMPTS_KEY);
	const { setItem: setLockedUntil } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	const fetchPasscode = async() => {
		passcode = await RNUserDefaults.get(PASSCODE_KEY);
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

	useEffect(() => {
		readStorage();
	}, []);

	const onEndProcess = (p) => {
		if (p === passcode) {
			finishProcess();
		} else {
			attempts += 1;
			if (attempts >= MAX_ATTEMPTS) {
				setStatus(TYPE.LOCKED);
				setLockedUntil(new Date().toISOString());
			} else {
				ref.current.wrongPasscode();
				setAttempts(attempts?.toString());
			}
		}
	};

	if (status === TYPE.LOCKED) {
		return <Locked theme={theme} setStatus={setStatus} />;
	}

	return <Base ref={ref} theme={theme} type={TYPE.ENTER} onEndProcess={onEndProcess} title={I18n.t('Passcode_enter_title')} />;
};

PasscodeEnter.propTypes = {
	theme: PropTypes.string,
	finishProcess: PropTypes.func
};

export default PasscodeEnter;
