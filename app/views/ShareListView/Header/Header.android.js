import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';

import TextInput from '../../../presentation/TextInput';
import I18n from '../../../i18n';
import { themes } from '../../../constants/colors';
import sharedStyles from '../../Styles';
import { isTablet } from '../../../utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		marginLeft: isTablet ? 10 : 0
	},
	title: {
		fontSize: 16,
		...sharedStyles.textSemibold
	}
});

const Header = React.memo(({ searching, onChangeSearchText, theme }) => {
	const titleColorStyle = { color: themes[theme].headerTintColor };
	const searchPlaceholderStyle = { color: themes[theme].headerTitleColor };
	const isLight = theme === 'light';

	if (searching) {
		return (
			<View style={styles.container}>
				<TextInput
					style={[styles.title, isLight && searchPlaceholderStyle]}
					placeholder={I18n.t('Search')}
					onChangeText={onChangeSearchText}
					theme={theme}
					autoFocus
					testID='share-list-view-search-input'
				/>
			</View>
		);
	}
	return <Text style={[styles.title, titleColorStyle]}>{I18n.t('Send_to')}</Text>;
});

Header.propTypes = {
	searching: PropTypes.bool,
	onChangeSearchText: PropTypes.func,
	theme: PropTypes.string
};

export default Header;
