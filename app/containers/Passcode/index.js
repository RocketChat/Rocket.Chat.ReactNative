import React, { useEffect, useRef, useState } from 'react';
import { useAsyncStorage } from '@react-native-community/async-storage';
import RNUserDefaults from 'rn-user-defaults';

import Base from './Base';
import Locked from './Locked';
import { TYPE } from './constants';
import { ATTEMPTS_KEY, LOCKED_OUT_TIMER_KEY, PASSCODE_KEY } from '../../constants/localAuthentication';
console.log('LOCKED_OUT_TIMER_KEY', LOCKED_OUT_TIMER_KEY);

const MAX_ATTEMPTS = 2;

const PasscodeEnter = ({
	theme, type, finishProcess
}) => {
	const ref = useRef(null);
	let attempts = 0;
	let isLocked = false;
	let passcode = null;
	const [status, setStatus] = useState(type);
  console.log('status', status);
	// const [attempts, setAttempts] = useState(null);
  // console.log('PasscodeEnter -> attempts', attempts);
	// const [isLocked, setIsLocked] = useState(null);
	// console.log('PasscodeEnter -> isLocked', isLocked);
	// const [passcode, setPasscode] = useState('');
  // console.log('passcode', passcode);
	const { getItem: getAttempts, setItem: setAttempts } = useAsyncStorage(ATTEMPTS_KEY);
	const { getItem: getIsLocked, setItem: setIsLocked } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	const fetchPasscode = async() => {
		passcode = await RNUserDefaults.get(PASSCODE_KEY);
	};

	const readStorage = async() => {
		isLocked = await getIsLocked();
		attempts = await getAttempts();
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
				setIsLocked(new Date().toISOString());
			} else {
				ref.current.wrongPasscode();
				setAttempts(attempts?.toString());
			}
		}
	};

	finishProcess = () => {
		alert('faz submit')
	}

	if (status === TYPE.LOCKED) {
		return <Locked theme={theme} setStatus={setStatus} />;
	}

	return <Base ref={ref} theme={theme} type={TYPE.ENTER} onEndProcess={onEndProcess} />;
};

export default PasscodeEnter;
