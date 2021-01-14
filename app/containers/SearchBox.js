import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';

import TextInput from '../presentation/TextInput';
import I18n from '../i18n';
import { CustomIcon } from '../lib/Icons';
import sharedStyles from '../views/Styles';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import { isIOS } from '../utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	searchBox: {
		alignItems: 'center',
		borderRadius: 10,
		flexDirection: 'row',
		fontSize: 17,
		height: 36,
		margin: 16,
		marginVertical: 10,
		paddingHorizontal: 10,
		flex: 1
	},
	input: {
		flex: 1,
		fontSize: 17,
		marginLeft: 8,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	},
	cancel: {
		marginRight: 15
	},
	cancelText: {
		...sharedStyles.textRegular,
		fontSize: 17
	}
});

const CancelButton = (onCancelPress, theme) => (
	<Touchable onPress={onCancelPress} style={styles.cancel}>
		<Text style={[styles.cancelText, { color: themes[theme].headerTintColor }]}>{I18n.t('Cancel')}</Text>
	</Touchable>
);

const SearchBox = ({
	onChangeText, onSubmitEditing, testID, hasCancel, onCancelPress, inputRef, theme, ...props
}) => (
	<View
		style={[
			styles.container,
			{ backgroundColor: isIOS ? themes[theme].headerBackground : themes[theme].headerSecondaryBackground }
		]}
	>
		<View style={[styles.searchBox, { backgroundColor: themes[theme].searchboxBackground }]}>
			<CustomIcon name='search' size={14} color={themes[theme].auxiliaryText} />
			<TextInput
				ref={inputRef}
				autoCapitalize='none'
				autoCorrect={false}
				blurOnSubmit
				clearButtonMode='while-editing'
				placeholder={I18n.t('Search')}
				returnKeyType='search'
				style={styles.input}
				testID={testID}
				underlineColorAndroid='transparent'
				onChangeText={onChangeText}
				onSubmitEditing={onSubmitEditing}
				theme={theme}
				{...props}
			/>
		</View>
		{ hasCancel ? CancelButton(onCancelPress, theme) : null }
	</View>
);

SearchBox.propTypes = {
	onChangeText: PropTypes.func.isRequired,
	onSubmitEditing: PropTypes.func,
	hasCancel: PropTypes.bool,
	onCancelPress: PropTypes.func,
	theme: PropTypes.string,
	inputRef: PropTypes.func,
	testID: PropTypes.string
};

export default withTheme(SearchBox);
