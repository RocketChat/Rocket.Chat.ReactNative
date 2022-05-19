import React from 'react';
import { TextInputProps, View } from 'react-native';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import FormTextInput from '../TextInput/FormTextInput';

const SearchBox = ({ onChangeText, onSubmitEditing, value, testID }: TextInputProps): JSX.Element => {
	const { colors, theme } = useTheme();
	const background = theme === 'light' ? colors.backgroundColor : colors.searchboxBackground;
	const inputStyle = {
		borderWidth: 2,
		borderColor: colors.searchboxBackground,
		backgroundColor: background,
		color: colors.auxiliaryTintColor
	};

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
				onChangeText={onChangeText}
				onSubmitEditing={onSubmitEditing}
				value={value}
				theme={theme}
				testID={testID}
				searchbox
			/>
		</View>
	);
};

export default SearchBox;
