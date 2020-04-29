import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Orientation from 'react-native-orientation-locker';
import useDeepCompareEffect from 'use-deep-compare-effect';
import _ from 'lodash';
import Modal from 'react-native-modal';
import Touchable from 'react-native-platform-touchable';

import { withTheme } from '../theme';
import { isTablet, hasNotch } from '../utils/deviceInfo';
import { TYPE } from '../containers/Passcode/constants';
import { PasscodeChoose } from '../containers/Passcode';
import EventEmitter from '../utils/events';
import { CustomIcon } from '../lib/Icons';
import { CHANGE_PASSCODE_EMITTER } from '../constants/localAuthentication';
import { themes } from '../constants/colors';

const ChangePasscodeView = React.memo(({ theme }) => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});

	useDeepCompareEffect(() => {
		if (!_.isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showChangePasscode = (args) => {
		setData(args);
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
	};

	const onSubmit = (passcode) => {
		const { submit } = data;
		if (submit) {
			submit(passcode);
		}
		setData({});
	};

	const onCancel = () => {
		const { reject } = data;
		if (reject) {
			reject();
		}
		setData({});
	};

	useEffect(() => {
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
		EventEmitter.addEventListener(CHANGE_PASSCODE_EMITTER, showChangePasscode);
		return (() => {
			if (!isTablet) {
				Orientation.unlockAllOrientations();
			}
			EventEmitter.removeListener(CHANGE_PASSCODE_EMITTER);
		});
	}, []);

	return (
		<Modal
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating
			style={{ margin: 0 }}
		>
			<PasscodeChoose theme={theme} type={TYPE.choose} finishProcess={onSubmit} />
			{!data?.force
				? (
					<Touchable onPress={onCancel} style={{ top: hasNotch ? 60 : 30, left: 15, position: 'absolute' }}>
						<CustomIcon name='cross' color={themes[theme].passcodePrimary} size={30} />
					</Touchable>
				)
				: null}
		</Modal>
	);
});

ChangePasscodeView.propTypes = {
	theme: PropTypes.string
};

export default withTheme(ChangePasscodeView);
