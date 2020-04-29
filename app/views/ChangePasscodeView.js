import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Orientation from 'react-native-orientation-locker';

import { themedHeader } from '../utils/navigation';
import { withTheme } from '../theme';
import { isTablet } from '../utils/deviceInfo';
import { TYPE } from '../containers/Passcode/constants';
import { PasscodeChoose } from '../containers/Passcode';

const ChangePasscodeView = React.memo(({ navigation, theme }) => {
	const getPasscode = (passcode) => {
		navigation.pop();
		const get = navigation.getParam('getPasscode', () => {});
		get(passcode);
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

	return <PasscodeChoose theme={theme} type={TYPE.choose} finishProcess={getPasscode} />;
});

ChangePasscodeView.navigationOptions = ({ screenProps, navigation }) => {
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

ChangePasscodeView.propTypes = {
	navigation: PropTypes.object,
	theme: PropTypes.string
};

export default withTheme(ChangePasscodeView);
