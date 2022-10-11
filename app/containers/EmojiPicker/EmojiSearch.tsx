import React, { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

import { FormTextInput } from '../TextInput/FormTextInput';
import { useTheme } from '../../theme';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	input: {
		height: 32,
		borderWidth: 0,
		paddingVertical: 0,
		borderRadius: 4
	},
	textInputContainer: {
		marginBottom: 0
	},
	inputContainer: {
		flex: 1,
		height: 32
	}
});

interface IEmojiSearchBarProps {
	onBlur?: TextInputProps['onBlur'];
	onChangeText: TextInputProps['onChangeText'];
	bottomSheet?: boolean;
}

export const EmojiSearch = React.forwardRef<TextInput, IEmojiSearchBarProps>(({ onBlur, onChangeText, bottomSheet }, ref) => {
	const { colors } = useTheme();
	const [searchText, setSearchText] = useState<string>('');

	const handleTextChange = (text: string) => {
		setSearchText(text);
		if (onChangeText) {
			onChangeText(text);
		}
	};

	return (
		<FormTextInput
			inputRef={ref}
			autoCapitalize='none'
			autoCorrect={false}
			autoComplete='off'
			returnKeyType='search'
			textContentType='none'
			blurOnSubmit
			placeholder={I18n.t('Search_emoji')}
			underlineColorAndroid='transparent'
			onChangeText={handleTextChange}
			inputStyle={[styles.input, { backgroundColor: colors.textInputSecondaryBackground }]}
			containerStyle={styles.textInputContainer}
			value={searchText}
			onClearInput={() => handleTextChange('')}
			onBlur={onBlur}
			iconRight={'search'}
			testID='emoji-searchbar-input'
			bottomSheet={bottomSheet}
		/>
	);
});
