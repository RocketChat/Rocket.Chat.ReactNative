import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';

import I18n from '../../i18n';
import { FormTextInput } from '../TextInput';

const styles = StyleSheet.create({
	inputContainer: {
		margin: 16,
		marginBottom: 16
	}
});

interface ISearchBox extends TextInputProps {
	label?: string;
}

const SearchBox = ({ onChangeText, onSubmitEditing, testID, label, placeholder, returnKeyType }: ISearchBox): JSX.Element => {
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
				placeholder={placeholder || I18n.t('Search')}
				returnKeyType={returnKeyType || 'search'}
				underlineColorAndroid='transparent'
				containerStyle={styles.inputContainer}
				onChangeText={internalOnChangeText}
				onSubmitEditing={onSubmitEditing}
				value={text}
				testID={testID}
				onClearInput={() => internalOnChangeText('')}
				iconRight={'search'}
				label={label}
			/>
		</View>
	);
};

export default SearchBox;
