import { useState } from 'react';
import { StyleSheet, type TextInputProps, View } from 'react-native';

import { useTheme } from '~/theme';
import I18n from '~/i18n';
import { FormTextInput } from '../TextInput';
import { supportsLiquidGlass } from '../TextInput/GlassBackground';

const styles = StyleSheet.create({
	inputContainer: {
		marginHorizontal: 16,
		marginVertical: 12
	}
});

const SearchBox = ({ onChangeText, onSubmitEditing, testID }: TextInputProps) => {
	const [text, setText] = useState('');

	const { colors } = useTheme();

	const internalOnChangeText = (value: string) => {
		setText(value);
		onChangeText?.(value);
	};

	return (
		<View testID='searchbox' style={{ backgroundColor: supportsLiquidGlass ? colors.surfaceTint : colors.surfaceRoom }}>
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
				iconLeft={supportsLiquidGlass ? 'search' : undefined}
				iconRight={supportsLiquidGlass ? undefined : 'search'}
				glass
			/>
		</View>
	);
};

export default SearchBox;
