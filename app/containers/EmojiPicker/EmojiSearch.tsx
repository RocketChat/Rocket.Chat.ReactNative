import React, { useState } from 'react';
import { StyleSheet, TextInputProps } from 'react-native';

import { FormTextInput } from '../TextInput/FormTextInput';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { isIOS } from '../../lib/methods/helpers';

const styles = StyleSheet.create({
	input: {
		height: 32,
		borderWidth: 0,
		paddingVertical: 0,
		borderRadius: 4
	},
	textInputContainer: {
		marginBottom: 0
	}
});

interface IEmojiSearchBarProps {
	onBlur?: TextInputProps['onBlur'];
	onChangeText: TextInputProps['onChangeText'];
	bottomSheet?: boolean;
}

export const EmojiSearch = ({ onBlur, onChangeText, bottomSheet }: IEmojiSearchBarProps): React.ReactElement => {
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
			autoCapitalize='none'
			autoCorrect={false}
			autoComplete='off'
			returnKeyType='search'
			textContentType='none'
			blurOnSubmit
			placeholder={I18n.t('Search_emoji')}
			placeholderTextColor={colors.fontAnnotation}
			underlineColorAndroid='transparent'
			onChangeText={handleTextChange}
			inputStyle={[styles.input, { backgroundColor: colors.surfaceNeutral }]}
			containerStyle={styles.textInputContainer}
			value={searchText}
			onClearInput={() => handleTextChange('')}
			onBlur={onBlur}
			iconRight={'search'}
			testID='emoji-searchbar-input'
			bottomSheet={bottomSheet && isIOS}
			autoFocus={!bottomSheet} // focus on input when not in reaction picker
		/>
	);
};
