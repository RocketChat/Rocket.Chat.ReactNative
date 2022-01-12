import React from 'react';
import { StyleSheet, View } from 'react-native';

import { withTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';
import TextInput from '../presentation/TextInput';
import { isIOS, isTablet } from '../utils/deviceInfo';
import { useOrientation } from '../dimensions';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		marginLeft: 0
	},
	title: {
		...sharedStyles.textSemibold
	}
});

interface ISearchHeader {
	theme?: string;
	onSearchChangeText?: (text: string) => void;
}

// TODO: it might be useful to refactor this component for reusage
const SearchHeader = ({ theme, onSearchChangeText }: ISearchHeader) => {
	const titleColorStyle = { color: themes[theme!].headerTitleColor };
	const isLight = theme === 'light';
	const { isLandscape } = useOrientation();
	const scale = isIOS && isLandscape && !isTablet ? 0.8 : 1;
	const titleFontSize = 16 * scale;

	return (
		<View style={styles.container}>
			<TextInput
				autoFocus
				style={[styles.title, isLight && titleColorStyle, { fontSize: titleFontSize }]}
				placeholder='Search'
				onChangeText={onSearchChangeText}
				theme={theme!}
				testID='thread-messages-view-search-header'
			/>
		</View>
	);
};

export default withTheme(SearchHeader);
