import { useState } from 'react';
import { StyleSheet, type TextInputProps, View } from 'react-native';

import { useTheme } from '~/theme';
import I18n from '~/i18n';
import { FormTextInput } from '../TextInput';
import { useListBackgroundColor } from '../NativeListRow/useListBackgroundColor';

const styles = StyleSheet.create({
	inputContainer: {
		marginHorizontal: 16,
		marginVertical: 12
	}
});

const SearchBox = ({ onChangeText, onSubmitEditing, testID }: TextInputProps) => {
	const [text, setText] = useState('');

	const { colors } = useTheme();
	const backgroundColor = useListBackgroundColor(colors.surfaceRoom);

	const internalOnChangeText = (value: string) => {
		setText(value);
		onChangeText?.(value);
	};

	return (
		<View testID='searchbox' style={{ backgroundColor }}>
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
