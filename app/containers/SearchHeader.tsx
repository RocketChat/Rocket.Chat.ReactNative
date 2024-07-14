import React from 'react';
import { StyleSheet, View } from 'react-native';

import I18n from '../i18n';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { themes } from '../lib/constants';
import { TextInput } from './TextInput';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		marginLeft: 0
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});

interface ISearchHeaderProps {
	onSearchChangeText?: (text: string) => void;
	testID?: string;
}

const SearchHeader = ({ onSearchChangeText, testID }: ISearchHeaderProps): JSX.Element => {
	const { theme } = useTheme();
	const isLight = theme === 'light';

	return (
		<View style={styles.container}>
			<TextInput
				autoFocus
				style={[styles.title, isLight && { color: themes[theme].fontTitlesLabels }]}
				placeholder={I18n.t('Search')}
				onChangeText={onSearchChangeText}
				testID={testID}
			/>
		</View>
	);
};

export default SearchHeader;
