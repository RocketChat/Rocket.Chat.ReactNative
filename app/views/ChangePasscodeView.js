import React from 'react';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';
import PINCode from '@haskkor/react-native-pincode';
import RNUserDefaults from 'rn-user-defaults';

import I18n from '../i18n';
import { themedHeader } from '../utils/navigation';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import sharedStyles from './Styles';
import { PASSCODE_KEY, PASSCODE_LENGTH } from '../constants/passcode';

const ScreenLockConfigView = React.memo(({ navigation, theme }) => {
	const savePasscode = async(passcode) => {
		await RNUserDefaults.set(PASSCODE_KEY, passcode);
		navigation.pop();
	};

	return (
		<SafeAreaView
			style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
		>
			<PINCode
				status='choose'
				passwordLength={PASSCODE_LENGTH}
				customBackSpaceIcon={() => null}
				storePin={savePasscode}
			/>
		</SafeAreaView>
	);
});

ScreenLockConfigView.navigationOptions = ({ screenProps, navigation }) => {
	const forceSetPasscode = navigation.getParam('forceSetPasscode', false);
	if (forceSetPasscode) {
		return {
			header: null
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
