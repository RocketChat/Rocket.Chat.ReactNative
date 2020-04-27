import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';
import RNUserDefaults from 'rn-user-defaults';
import Orientation from 'react-native-orientation-locker';
import { sha256 } from 'js-sha256';

import { themedHeader } from '../utils/navigation';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import sharedStyles from './Styles';
import { PASSCODE_KEY } from '../constants/localAuthentication';
import { isTablet } from '../utils/deviceInfo';
import { TYPE } from '../containers/Passcode/constants';
import { PasscodeChoose } from '../containers/Passcode';

const ScreenLockConfigView = React.memo(({ navigation, theme }) => {
	const savePasscode = async(passcode) => {
		await RNUserDefaults.set(PASSCODE_KEY, sha256(passcode));
		navigation.pop();
	};

	useEffect(() => {
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
		return (() => {
			if (!isTablet) {
				Orientation.unlockAllOrientations();
			}
		});
	}, []);

	return (
		<SafeAreaView
			style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
		>
			<PasscodeChoose theme={theme} type={TYPE.choose} finishProcess={savePasscode} />
		</SafeAreaView>
	);
});

ScreenLockConfigView.navigationOptions = ({ screenProps, navigation }) => {
	const forceSetPasscode = navigation.getParam('forceSetPasscode', false);
	if (forceSetPasscode) {
		return {
			header: null,
			...themedHeader(screenProps.theme)
		};
	}
	return {
		title: 'Change Passcode',
		...themedHeader(screenProps.theme)
	};
};

ScreenLockConfigView.propTypes = {
	navigation: PropTypes.object,
	theme: PropTypes.string
};

export default withTheme(ScreenLockConfigView);
