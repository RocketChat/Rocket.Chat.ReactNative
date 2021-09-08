import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import TextInput from '../../presentation/TextInput';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import styles from './styles';

const SearchBox = ({
	onChangeText, onSubmitEditing, testID, inputRef, theme, ...props
}) => (
	<View style={[styles.searchBox, { backgroundColor: themes[theme].messageboxBackground, borderColor: themes[theme].borderColor }]}>
		<CustomIcon name='search' size={14} color={themes[theme].auxiliaryText} />
		<TextInput
			ref={inputRef}
			autoCapitalize='none'
			autoCorrect={false}
			blurOnSubmit
			clearButtonMode='while-editing'
			placeholder={I18n.t('Search')}
			returnKeyType='search'
			style={styles.inputSearch}
			testID={testID}
			underlineColorAndroid='transparent'
			onChangeText={onChangeText}
			onSubmitEditing={onSubmitEditing}
			theme={theme}
			{...props}
		/>
	</View>
);

SearchBox.propTypes = {
	onChangeText: PropTypes.func.isRequired,
	onSubmitEditing: PropTypes.func,
	theme: PropTypes.string,
	inputRef: PropTypes.func,
	testID: PropTypes.string
};

export default SearchBox;
