import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';
import I18n from '../../../i18n';
import styles from '../styles';
import DisclosureIndicator from '../../../containers/DisclosureIndicator';
import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';
import { isAndroid } from '../../../utils/deviceInfo';


const Directory = React.memo(({ goDirectory, theme }) => {
	const isLight = theme === 'light';
	const color = !isLight && isAndroid ? { color: themes[theme].auxiliaryText } : { color: themes[theme].tintColor };
	return (
		<Touch
			onPress={goDirectory}
			theme={theme}
			style={{
				backgroundColor: isLight
					? themes[theme].backgroundColor
					: themes[theme].headerBackground
			}}
		>
			<View
				style={[
					styles.dropdownContainerHeader,
					{ borderBottomWidth: StyleSheet.hairlineWidth, borderColor: themes[theme].separatorColor }
				]}
			>
				<CustomIcon style={[styles.directoryIcon, color]} size={22} name='discover' />
				<Text style={[styles.directoryText, color]}>{I18n.t('Directory')}</Text>
				<DisclosureIndicator />
			</View>
		</Touch>
	);
});

Directory.propTypes = {
	goDirectory: PropTypes.func,
	theme: PropTypes.string
};

export default withTheme(Directory);
