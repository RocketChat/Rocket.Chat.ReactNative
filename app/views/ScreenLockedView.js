import React, { useEffect, useState } from 'react';
import {
	View, StyleSheet, Text
} from 'react-native';
import PropTypes from 'prop-types';
// import PINCode, { PinStatus } from '@haskkor/react-native-pincode';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import _ from 'lodash';
import Orientation from 'react-native-orientation-locker';

// import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import EventEmitter from '../utils/events';
// import sharedStyles from './Styles';
import { withSplit } from '../split';
import { LOCAL_AUTHENTICATE_EMITTER } from '../constants/localAuthentication';
import { isTablet } from '../utils/deviceInfo';
import Passcode from '../containers/Passcode';
import { TYPE } from '../containers/Passcode/constants';

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
		>
			<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				{/* <PINCode
					status={PinStatus.enter}
					passwordLength={PASSCODE_LENGTH}
					customBackSpaceIcon={() => null}
					finishProcess={onSubmit}
					storedPin={passcode}
					maxAttempts={MAX_ATTEMPTS}
					touchIDDisabled
					vibrationEnabled={false}
					timeLocked={TIME_TO_LOCK}
					colorCircleButtons={themes[theme].backgroundColor}
					colorPassword={themes[theme].titleText}
					colorPasswordEmpty={themes[theme].titleText}
					colorPasswordError={themes[theme].dangerColor}
					numbersButtonOverlayColor={themes[theme].bannerBackground}
					stylePinCodeButtonNumber={themes[theme].bodyText}
					stylePinCodeButtonNumberPressed={themes[theme].bodyText}
					stylePinCodeColorTitle={themes[theme].titleText}
					stylePinCodeColorSubtitle={themes[theme].titleText}
					stylePinCodeColorSubtitleError={themes[theme].dangerColor}
					stylePinCodeButtonCircle={[styles.circleButton, { borderColor: themes[theme].borderColor }]}
					stylePinCodeTextTitle={styles.title}
					stylePinCodeTextSubtitle={styles.subtitle}
					stylePinCodeTextButtonCircle={styles.circleButtonText}
					stylePinCodeHiddenPasswordSizeEmpty={8}
					stylePinCodeHiddenPasswordSizeFull={12}
					titleEnter='Enter your passcode'
					timePinLockedAsyncStorageName={LOCKED_OUT_TIMER_KEY}
					pinAttemptsAsyncStorageName={ATTEMPTS_KEY}
					lockedPage={<AppLocked />}
				/> */}
				<Passcode theme={theme} type={TYPE.ENTER} finishProcess={onSubmit} />
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
