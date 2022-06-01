import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import TextInput from '../../../containers/TextInput';
import I18n from '../../../i18n';
import { themes } from '../../../lib/constants';
import sharedStyles from '../../Styles';
import { IShareListHeader } from './interface';
import { fontSize } from '../../../lib/theme';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	search: {
		fontSize: fontSize[20],
		...sharedStyles.textRegular,
		marginHorizontal: 14
	},
	title: {
		...sharedStyles.textBold,
		marginHorizontal: 16,
		fontSize: fontSize[20]
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
