import React, { useCallback, useState } from 'react';
import { TextInputProps, View } from 'react-native';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import FormTextInput from '../TextInput/FormTextInput';

const SearchBox = ({ onChangeText, onSubmitEditing, testID }: TextInputProps): JSX.Element => {
	const { colors, theme } = useTheme();
	const [text, setText] = useState('');
	const background = theme === 'light' ? colors.backgroundColor : colors.searchboxBackground;
	const inputStyle = {
		borderWidth: 2,
		paddingVertical: 0,
		borderColor: colors.searchboxBackground,
		backgroundColor: background,
		color: colors.auxiliaryTintColor
	};

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
				placeholderTextColor={colors.auxiliaryTintColor}
				returnKeyType='search'
				underlineColorAndroid='transparent'
				containerStyle={{ margin: 16 }}
				inputStyle={inputStyle}
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
