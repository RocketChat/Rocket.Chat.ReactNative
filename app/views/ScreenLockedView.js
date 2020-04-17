import React, { useEffect, useState } from 'react';
import {
	View, Text, StyleSheet, TextInput
} from 'react-native';
import { connect } from 'react-redux';
import PINCode from '@haskkor/react-native-pincode';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import _ from 'lodash';

import { appInit as appInitAction } from '../actions';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import EventEmitter from '../utils/events';

import sharedStyles from './Styles';
import { withSplit } from '../split';

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

	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});

	useDeepCompareEffect(() => {
		if (!_.isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showScreenLock = args => setData(args);

	useEffect(() => {
		EventEmitter.addEventListener(LOCAL_AUTHENTICATE, showScreenLock);

		return () => EventEmitter.removeListener(LOCAL_AUTHENTICATE);
	}, []);

	const onSubmit = () => {
		const { submit } = data;
		if (submit) {
			submit()
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
					status={'enter'}
					passwordLength={6}
					customBackSpaceIcon={() => null}
					// endProcessFunction={console.log}
					finishProcess={onSubmit}
					// onFail={() => alert('fail')}
					storedPin='111111'
					maxAttempts={3}
				/>
				{/* <Text onPress={onSubmit}>VAI</Text> */}
			</View>
		</Modal>
	);
}));

export default withSplit(withTheme(ScreenLockedView));
