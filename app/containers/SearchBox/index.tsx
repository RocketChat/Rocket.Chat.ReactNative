import { useState } from 'react';
import { type TextInputProps, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import I18n from '../../i18n';
import { FormTextInput } from '../TextInput';

const styles = StyleSheet.create(theme => ({
	searchbox: {
		backgroundColor: theme.colors.surfaceRoom
	},
	inputContainer: {
		marginHorizontal: 12,
		marginTop: 16,
		// override the default margin bottom of the FormTextInput
		marginBottom: 16
	}
}));

const SearchBox = ({ onChangeText, onSubmitEditing, testID }: TextInputProps) => {
	const [text, setText] = useState('');

	const internalOnChangeText = (value: string) => {
		setText(value);
		onChangeText?.(value);
	};

	return (
		<View testID='searchbox' style={styles.searchbox}>
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
