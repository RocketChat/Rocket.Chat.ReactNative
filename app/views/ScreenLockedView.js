import React, { useEffect, useState } from 'react';
import {
	View, StyleSheet
} from 'react-native';
import PINCode from '@haskkor/react-native-pincode';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import _ from 'lodash';
import RNUserDefaults from 'rn-user-defaults';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import EventEmitter from '../utils/events';

import sharedStyles from './Styles';
import { withSplit } from '../split';
import { PASSCODE_KEY, PASSCODE_LENGTH } from '../constants/passcode';

export const LOCAL_AUTHENTICATE = 'LOCAL_AUTHENTICATE';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	text: {
		fontSize: 16,
		paddingTop: 10,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

const ScreenLockedView = React.memo(withTheme(({ theme, split }) => {
	const [passcode, setPasscode] = useState('');
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});

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
	};

	useEffect(() => {
		EventEmitter.addEventListener(LOCAL_AUTHENTICATE, showScreenLock);
		fetchPasscode();
		return () => EventEmitter.removeListener(LOCAL_AUTHENTICATE);
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
			<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				<PINCode
					status='enter'
					passwordLength={PASSCODE_LENGTH}
					customBackSpaceIcon={() => null}
					finishProcess={onSubmit}
					storedPin={passcode}
					// maxAttempts={3}
				/>
			</View>
		</Modal>
	);
}));

export default withSplit(withTheme(ScreenLockedView));
