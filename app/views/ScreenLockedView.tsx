import React, { useEffect, useState } from 'react';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import isEmpty from 'lodash/isEmpty';
import Orientation from 'react-native-orientation-locker';

import EventEmitter from '../utils/events';
import { LOCAL_AUTHENTICATE_EMITTER } from '../lib/constants';
import { isTablet } from '../utils/deviceInfo';
import { PasscodeEnter } from '../containers/Passcode';

interface IData {
	submit?: () => void;
	hasBiometry?: boolean;
}

const ScreenLockedView = (): JSX.Element => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<IData>({});

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showScreenLock = (args: IData) => {
		setData(args);
	};

	useEffect(() => {
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
		const listener = EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		return () => {
			if (!isTablet) {
				Orientation.unlockAllOrientations();
			}
			EventEmitter.removeListener(LOCAL_AUTHENTICATE_EMITTER, listener);
		};
	}, []);

	const onSubmit = () => {
		const { submit } = data;
		if (submit) {
			submit();
		}
		setData({});
	};

	return (
		<Modal
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating
			style={{ margin: 0 }}
			animationIn='fadeIn'
			animationOut='fadeOut'>
			<PasscodeEnter hasBiometry={!!data?.hasBiometry} finishProcess={onSubmit} />
		</Modal>
	);
};

export default ScreenLockedView;
