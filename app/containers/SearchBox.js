import React from 'react';
import {
	View, StyleSheet, TextInput, Text
} from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';

import I18n from '../i18n';
import { CustomIcon } from '../lib/Icons';
import sharedStyles from '../views/Styles';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	searchBox: {
		alignItems: 'center',
		borderRadius: 10,
		color: '#8E8E93',
		flexDirection: 'row',
		fontSize: 17,
		height: 36,
		margin: 16,
		marginVertical: 10,
		paddingHorizontal: 10,
		flex: 1
	},
	input: {
		color: '#8E8E93',
		flex: 1,
		fontSize: 17,
		marginLeft: 8,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	},
	cancel: {
		marginRight: 10
	},
	cancelText: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorHeaderBack,
		fontSize: 17
	}
});

const CancelButton = onCancelPress => (
	<Touchable onPress={onCancelPress} style={styles.cancel}>
		<Text style={styles.cancelText}>{I18n.t('Cancel')}</Text>
	</Touchable>
);

const SearchBox = ({
	onChangeText, onSubmitEditing, testID, hasCancel, onCancelPress, theme, ...props
}) => (
	<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
		<View style={[styles.searchBox, { backgroundColor: themes[theme].borderColor }]}>
			<CustomIcon name='magnifier' size={14} color={themes[theme].auxiliaryText} />
			<TextInput
				autoCapitalize='none'
				autoCorrect={false}
				blurOnSubmit
				clearButtonMode='while-editing'
				placeholder={I18n.t('Search')}
				placeholderTextColor={themes[theme].auxiliaryText}
				returnKeyType='search'
				style={[styles.input, { color: themes[theme].controlText }]}
				testID={testID}
				underlineColorAndroid='transparent'
				onChangeText={onChangeText}
				onSubmitEditing={onSubmitEditing}
				keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
				{...props}
			/>
		</View>
		{ hasCancel ? CancelButton(onCancelPress) : null }
	</View>
);

SearchBox.propTypes = {
	onChangeText: PropTypes.func.isRequired,
	onSubmitEditing: PropTypes.func,
	hasCancel: PropTypes.bool,
	onCancelPress: PropTypes.func,
	testID: PropTypes.string,
	theme: PropTypes.string
};

export default withTheme(SearchBox);
