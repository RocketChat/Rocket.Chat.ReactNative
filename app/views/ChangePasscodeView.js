import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Orientation from 'react-native-orientation-locker';
import useDeepCompareEffect from 'use-deep-compare-effect';
import isEmpty from 'lodash/isEmpty';
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

const styles = StyleSheet.create({
	modal: {
		margin: 0
	},
	close: {
		position: 'absolute',
		top: hasNotch ? 50 : 30,
		left: 15
	}
});

const ChangePasscodeView = React.memo(({ theme }) => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showChangePasscode = (args) => {
		setData(args);
	};

	const onSubmit = (passcode) => {
		const { submit } = data;
		if (submit) {
			submit(passcode);
		}
		setData({});
	};

	const onCancel = () => {
		const { cancel } = data;
		if (cancel) {
			cancel();
		}
		setData({});
	};

	useEffect(() => {
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
		const listener = EventEmitter.addEventListener(CHANGE_PASSCODE_EMITTER, showChangePasscode);
		return (() => {
			if (!isTablet) {
				Orientation.unlockAllOrientations();
			}
			EventEmitter.removeListener(CHANGE_PASSCODE_EMITTER, listener);
		});
	}, []);

	return (
		<Modal
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating
			style={styles.modal}
		>
			<PasscodeChoose theme={theme} type={TYPE.choose} finishProcess={onSubmit} force={data?.force} />
			{!data?.force
				? (
					<Touchable onPress={onCancel} style={styles.close}>
						<CustomIcon name='close' color={themes[theme].passcodePrimary} size={30} />
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
