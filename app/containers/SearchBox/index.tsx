import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import FormTextInput from '../TextInput/FormTextInput';

const styles = StyleSheet.create({
	inputContainer: {
		margin: 16,
		marginBottom: 16
	}
});

const SearchBox = ({ onChangeText, onSubmitEditing, testID }: TextInputProps): JSX.Element => {
	const { theme } = useTheme();
	const [text, setText] = useState('');

	const internalOnChangeText = useCallback(value => {
		setText(value);
		onChangeText?.(value);
	}, []);

	return (
		<View testID='searchbox'>
			<FormTextInput
				autoCapitalize='none'
				autoCorrect={false}
				blurOnSubmit
				placeholder={I18n.t('Search')}
				returnKeyType='search'
				underlineColorAndroid='transparent'
				containerStyle={styles.inputContainer}
				onChangeText={internalOnChangeText}
				onSubmitEditing={onSubmitEditing}
				value={text}
				theme={theme}
				testID={testID}
				onClearInput={() => internalOnChangeText('')}
				iconRight={'search'}
			/>
		</View>
	);
};

export default SearchBox;
