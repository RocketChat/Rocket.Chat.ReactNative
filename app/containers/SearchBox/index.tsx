import React from 'react';
import { StyleSheet, TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	searchBox: {
		flex: 1,
		alignItems: 'center',
		flexDirection: 'row',
		borderRadius: 2,
		borderWidth: 2,
		height: 44,
		margin: 16,
		paddingHorizontal: 16
	},
	input: {
		flex: 1,
		fontSize: 16,
		...sharedStyles.textRegular
	}
});

export interface ISearchBox extends TextInputProps {
	showCancelIcon: boolean;
	onCancelSearch: () => void;
}

const SearchBox = ({ showCancelIcon, onCancelSearch, onChangeText, onSubmitEditing, value, testID }: ISearchBox): JSX.Element => {
	const { colors } = useTheme();
	return (
		<View style={styles.container} testID='searchbox-component'>
			<View style={[styles.searchBox, { borderColor: colors.searchboxBackground }]}>
				<RNTextInput
					autoCapitalize='none'
					autoCorrect={false}
					blurOnSubmit
					placeholder={I18n.t('Search')}
					returnKeyType='search'
					underlineColorAndroid='transparent'
					style={styles.input}
					onChangeText={onChangeText}
					onSubmitEditing={onSubmitEditing}
					value={value}
					testID={testID}
				/>

				{showCancelIcon ? (
					<Touchable onPress={onCancelSearch} testID='searchbox-component-cancel-search'>
						<CustomIcon name='input-clear' size={18} color={colors.auxiliaryText} />
					</Touchable>
				) : (
					<CustomIcon name='search' size={18} color={colors.auxiliaryTintColor} />
				)}
			</View>
		</View>
	);
};

export default SearchBox;
