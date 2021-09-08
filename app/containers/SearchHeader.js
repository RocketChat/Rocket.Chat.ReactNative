import React from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';

import { withDimensions } from '../dimensions';
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

const SearchHeader = ({
	onSearchChangeText, placeholder, theme, testID, width, height
}) => {
	const isLight = theme === 'light';
	const isLandscape = width > height;
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

SearchHeader.propTypes = {
	onSearchChangeText: PropTypes.func.isRequired,
	placeholder: PropTypes.string.isRequired,
	theme: PropTypes.string,
	testID: PropTypes.string,
	width: PropTypes.number,
	height: PropTypes.number
};
export default withDimensions(SearchHeader);
