import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';

import TextInput from './TextInput';
import I18n from '../i18n';
import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import { isTablet, isIOS } from '../utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		height: '100%',
		justifyContent: 'center',
		marginLeft: isTablet ? 10 : 2
	},
	search: {
		paddingHorizontal: 0,
		marginBottom: isIOS ? 2 : -1
	},
	title: {
		fontSize: 16,
		...sharedStyles.textSemibold
	}
});

const Header = React.memo(({
	searching, onChangeSearchText, testID, theme
}) => {
	const titleColorStyle = { color: themes[theme].headerTintColor };
	const searchPlaceholderStyle = { color: themes[theme].headerTitleColor };
	const isLight = theme === 'light';
	if (searching) {
		return (
			<View style={styles.container}>
				<TextInput
					style={[styles.title, styles.search, isLight && searchPlaceholderStyle]}
					placeholderColor={themes[theme].headerTitleColor}
					placeholder={I18n.t('Search')}
					onChangeText={onChangeSearchText}
					theme={theme}
					autoFocus
					testID={testID}
				/>
			</View>
		);
	}
	return (
		<View style={styles.container}>
			<Text style={[styles.title, titleColorStyle]}>{I18n.t('Send_to')}</Text>
		</View>
	);
});

Header.propTypes = {
	searching: PropTypes.bool,
	onChangeSearchText: PropTypes.func,
	theme: PropTypes.string,
	testID: PropTypes.string
};

export default Header;
