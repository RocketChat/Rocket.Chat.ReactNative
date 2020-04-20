import React from 'react';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';
import PINCode, { PinStatus } from '@haskkor/react-native-pincode';
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
				status={PinStatus.choose}
				passwordLength={PASSCODE_LENGTH}
				customBackSpaceIcon={() => null}
				storePin={savePasscode}
				touchIDDisabled
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
				stylePinCodeButtonCircle={{ borderWidth: 1, borderColor: themes[theme].borderColor }}
				stylePinCodeTextTitle={{ ...sharedStyles.textRegular, fontWeight: '400' }}
				stylePinCodeTextSubtitle={{ ...sharedStyles.textRegular, fontWeight: '300' }}
				stylePinCodeTextButtonCircle={{ ...sharedStyles.textRegular, fontWeight: '100' }}
				stylePinCodeHiddenPasswordSizeEmpty={8}
				stylePinCodeHiddenPasswordSizeFull={12}
				titleChoose='Enter your new passcode'
				titleConfirm='Confirm your passcode'
				subtitleChoose=''
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
