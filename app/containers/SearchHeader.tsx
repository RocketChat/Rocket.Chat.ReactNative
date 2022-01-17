import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
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

interface ISearchHeaderProps {
	onSearchChangeText?: (text: string) => void;
	placeholder: string;
	testID: string;
}

const SearchHeader = ({ onSearchChangeText, placeholder, testID }: ISearchHeaderProps) => {
	const { theme } = useTheme();
	const isLight = theme === 'light';
	const { isLandscape } = useOrientation();
	const scale = isIOS && isLandscape && !isTablet ? 0.8 : 1;
	const titleFontSize = 16 * scale;

	return (
		<View style={styles.container}>
			<TextInput
				autoFocus
				style={[styles.title, isLight && { color: themes[theme].headerTitleColor }, { fontSize: titleFontSize }]}
				placeholder={placeholder}
				onChangeText={onSearchChangeText}
				theme={theme}
				testID={testID}
			/>
		</View>
	);
};

export default SearchHeader;
