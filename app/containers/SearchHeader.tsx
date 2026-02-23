import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import I18n from '../i18n';
import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { themes } from '../lib/constants/colors';
import { TextInput } from './TextInput';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		marginLeft: -5
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: 16,
		paddingVertical: 6
	}
});

interface ISearchHeaderProps {
	onSearchChangeText?: (text: string) => void;
	testID?: string;
	style?: StyleProp<ViewStyle>;
}

const SearchHeader = ({ onSearchChangeText, testID, style }: ISearchHeaderProps): JSX.Element => {
	const { theme } = useTheme();
	const isLight = theme === 'light';

	return (
		<View style={[styles.container, style]}>
			<TextInput
				autoFocus
				style={[styles.title, isLight && { color: themes[theme].fontTitlesLabels }]}
				placeholder={I18n.t('Search')}
				onChangeText={onSearchChangeText}
				testID={testID}
				autoComplete='off'
				autoCorrect={false}
				autoCapitalize='none'
			/>
		</View>
	);
};

export default SearchHeader;
