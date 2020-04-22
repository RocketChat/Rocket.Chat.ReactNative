import React, { useEffect, useState } from 'react';
import {
	View, StyleSheet, Text
} from 'react-native';
import PropTypes from 'prop-types';
import PINCode, { PinStatus } from '@haskkor/react-native-pincode';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import _ from 'lodash';
import RNUserDefaults from 'rn-user-defaults';
import { useAsyncStorage } from '@react-native-community/async-storage';
import moment from 'moment';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import EventEmitter from '../utils/events';
import sharedStyles from './Styles';
import { withSplit } from '../split';
import {
	PASSCODE_KEY, PASSCODE_LENGTH, LOCAL_AUTHENTICATE_EMITTER, LOCKED_OUT_TIMER_KEY, ATTEMPTS_KEY
} from '../constants/localAuthentication';
import { resetAttempts } from '../utils/localAuthentication';
import { isTablet } from '../utils/deviceInfo';
import Orientation from 'react-native-orientation-locker';

const MAX_ATTEMPTS = 6;
const TIME_TO_LOCK = 30000;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		width: '100%'
	},
	title: {
		...sharedStyles.textRegular,
		fontSize: 20,
		fontWeight: '400',
		marginBottom: 10,
		textAlign: 'center'
	},
	subtitle: {
		...sharedStyles.textRegular,
		fontSize: 16,
		fontWeight: '400',
		textAlign: 'center'
	},
	circleButtonText: {
		...sharedStyles.textRegular,
		fontWeight: '100'
	},
	circleButton: {
		borderWidth: 1
	}
});

const getLockedUntil = t => moment(t).add(TIME_TO_LOCK);

const getDiff = t => new Date(t) - new Date();

const Timer = ({ time, theme, changeStatus }) => {
	const calcTimeLeft = () => {
		const diff = getDiff(time);
		if (diff > 0) {
			return Math.floor((diff / 1000) % 60);
		}
	};

	const [timeLeft, setTimeLeft] = useState(calcTimeLeft());

	useEffect(() => {
		setTimeout(() => {
			setTimeLeft(calcTimeLeft());
			if (timeLeft <= 1) {
				resetAttempts();
				changeStatus(PinStatus.initial);
			}
		}, 1000);
	});

	if (!timeLeft) {
		return null;
	}

	return (
		<Text style={[styles.subtitle, { color: themes[theme].bodyText }]}>Try again in {timeLeft} seconds</Text>
	);
};

// `changeStatus` prop is injected from react-native-pincode
const AppLocked = withTheme(({ theme, changeStatus }) => {
	const [lockedUntil, setLockedUntil] = useState(null);
	const { getItem } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	const readItemFromStorage = async() => {
		const item = await getItem();
		setLockedUntil(getLockedUntil(item));
	};

	useEffect(() => {
		readItemFromStorage();
	}, []);

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
			<Text style={[styles.title, { color: themes[theme].titleText }]}>App locked</Text>
			<Timer theme={theme} time={lockedUntil} changeStatus={changeStatus} />
		</View>
	);
});

const ScreenLockedView = ({ theme }) => {
	const [passcode, setPasscode] = useState('');
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});
	const { getItem } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	useDeepCompareEffect(() => {
		if (!_.isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const fetchPasscode = async() => {
		const storedPin = await RNUserDefaults.get(PASSCODE_KEY);
		setPasscode(storedPin);
	};

	const showScreenLock = (args) => {
		setData(args);
		fetchPasscode();
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
	};

	const checkOldSession = async() => {
		const time = await getItem();
		const lockedUntil = getLockedUntil(time);
		const diff = getDiff(lockedUntil);
		if (diff <= 1) {
			resetAttempts();
		}
	};

	useEffect(() => {
		EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		fetchPasscode();
		checkOldSession();
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
				<PINCode
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
				/>
			</View>
		</Modal>
	);
};

Timer.propTypes = {
	time: PropTypes.string,
	theme: PropTypes.string,
	changeStatus: PropTypes.func
};

AppLocked.propTypes = {
	theme: PropTypes.string,
	changeStatus: PropTypes.func
};

ScreenLockedView.propTypes = {
	theme: PropTypes.string,
	// eslint-disable-next-line react/no-unused-prop-types
	split: PropTypes.bool // TODO: need it?
};

export default withSplit(withTheme(ScreenLockedView));
