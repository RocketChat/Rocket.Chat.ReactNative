import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';

import TextInput from '../../../presentation/TextInput';
import I18n from '../../../i18n';
import { themes } from '../../../constants/colors';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	search: {
		fontSize: 20,
		...sharedStyles.textRegular,
		marginHorizontal: 14
	},
	title: {
		fontSize: 20,
		...sharedStyles.textBold,
		marginHorizontal: 16
	}
});

const Header = React.memo(({ searching, onChangeSearchText, theme }) => {
	const titleColorStyle = { color: themes[theme].headerTintColor };
	const isLight = theme === 'light';
	if (searching) {
		return (
			<View style={styles.container}>
				<TextInput
					style={[styles.search, isLight && titleColorStyle]}
					placeholder={I18n.t('Search')}
					onChangeText={onChangeSearchText}
					theme={theme}
					autoFocus
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
