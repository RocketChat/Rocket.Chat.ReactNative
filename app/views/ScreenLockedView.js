import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import _ from 'lodash';
import Orientation from 'react-native-orientation-locker';

import { withTheme } from '../theme';
import EventEmitter from '../utils/events';
import { LOCAL_AUTHENTICATE_EMITTER } from '../constants/localAuthentication';
import { isTablet } from '../utils/deviceInfo';
import { PasscodeEnter } from '../containers/Passcode';

const ScreenLockedView = ({ theme }) => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});

	useDeepCompareEffect(() => {
		if (!_.isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showScreenLock = (args) => {
		setData(args);
	};

	useEffect(() => {
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
		EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		return (() => {
			if (!isTablet) {
				Orientation.unlockAllOrientations();
			}
			EventEmitter.removeListener(LOCAL_AUTHENTICATE_EMITTER);
		});
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
			animationOut='fadeOut'
		>
			<PasscodeEnter theme={theme} hasBiometry={data?.hasBiometry} finishProcess={onSubmit} />
		</Modal>
	);
};

ScreenLockedView.propTypes = {
	theme: PropTypes.string
};

export default withTheme(ScreenLockedView);
