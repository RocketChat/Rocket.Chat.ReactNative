import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import TextInput from '../../../containers/TextInput';
import I18n from '../../../i18n';
import { themes } from '../../../lib/constants';
import sharedStyles from '../../Styles';
import { IShareListHeader } from './interface';

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

const Header = React.memo(({ searching, onChangeSearchText, theme }: IShareListHeader) => {
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

export default Header;
