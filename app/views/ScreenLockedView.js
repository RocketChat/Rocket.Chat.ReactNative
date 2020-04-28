import React, { useEffect, useState } from 'react';
import {
	View, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import _ from 'lodash';
import Orientation from 'react-native-orientation-locker';

import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import EventEmitter from '../utils/events';
import { withSplit } from '../split';
import { LOCAL_AUTHENTICATE_EMITTER } from '../constants/localAuthentication';
import { isTablet } from '../utils/deviceInfo';
import { PasscodeEnter } from '../containers/Passcode';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		width: '100%'
	}
});

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
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
	};

	useEffect(() => {
		EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		return () => EventEmitter.removeListener(LOCAL_AUTHENTICATE_EMITTER);
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
			<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<PasscodeEnter theme={theme} hasBiometry={data?.hasBiometry} finishProcess={onSubmit} />
			</View>
		</Modal>
	);
};

ScreenLockedView.propTypes = {
	theme: PropTypes.string,
	// eslint-disable-next-line react/no-unused-prop-types
	split: PropTypes.bool // TODO: need it?
};

export default withSplit(withTheme(ScreenLockedView));
