import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { FormTextInput } from '../TextInput';

const styles = StyleSheet.create({
	inputContainer: {
		margin: 16,
		marginBottom: 16
	}
});

const SearchBox = ({ onChangeText, onSubmitEditing, testID }: TextInputProps): JSX.Element => {
	const [text, setText] = useState('');

	const { colors } = useTheme();

	const internalOnChangeText = useCallback((value: string) => {
		setText(value);
		onChangeText?.(value);
	}, []);

	return (
		<View testID='searchbox' style={{ backgroundColor: colors.surfaceRoom }} >
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
				testID={testID}
				onClearInput={() => internalOnChangeText('')}
				iconRight={'search'}
			/>
		</View>
	);
};

export default SearchBox;
