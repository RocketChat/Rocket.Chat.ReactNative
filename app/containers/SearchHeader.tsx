import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useOrientation } from '../dimensions';
import { isIOS, isTablet } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import TextInput from '../presentation/TextInput';

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
	theme: string;
	testID: string;
}

const SearchHeader = ({ onSearchChangeText, placeholder, theme, testID }: ISearchHeaderProps) => {
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
