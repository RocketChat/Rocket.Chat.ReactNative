import React from 'react';
import { StyleSheet, Text, TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import I18n from '../i18n';
import { CustomIcon } from '../lib/Icons';
import TextInput from '../presentation/TextInput';
import { useTheme } from '../theme';
import { isIOS } from '../utils/deviceInfo';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	searchBox: {
		alignItems: 'center',
		borderRadius: 10,
		flexDirection: 'row',
		fontSize: 17,
		height: 36,
		margin: 16,
		marginVertical: 10,
		paddingHorizontal: 10,
		flex: 1
	},
	input: {
		flex: 1,
		fontSize: 17,
		marginLeft: 8,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	},
	cancel: {
		marginRight: 15
	},
	cancelText: {
		...sharedStyles.textRegular,
		fontSize: 17
	}
});

interface ISearchBox extends TextInputProps {
	value?: string;
	hasCancel?: boolean;
	onCancelPress?: Function;
	inputRef?: React.Ref<RNTextInput>;
}

const CancelButton = ({ onCancelPress }: { onCancelPress?: Function }) => {
	const { colors } = useTheme();
	return (
		<Touchable onPress={onCancelPress} style={styles.cancel}>
			<Text style={[styles.cancelText, { color: colors.headerTintColor }]}>{I18n.t('Cancel')}</Text>
		</Touchable>
	);
};

const SearchBox = ({ hasCancel, onCancelPress, inputRef, ...props }: ISearchBox): React.ReactElement => {
	const { theme, colors } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: isIOS ? colors.headerBackground : colors.headerSecondaryBackground }]}>
			<View style={[styles.searchBox, { backgroundColor: colors.searchboxBackground }]}>
				<CustomIcon name='search' size={14} color={colors.auxiliaryText} />
				<TextInput
					ref={inputRef}
					autoCapitalize='none'
					autoCorrect={false}
					blurOnSubmit
					clearButtonMode='while-editing'
					placeholder={I18n.t('Search')}
					returnKeyType='search'
					style={styles.input}
					underlineColorAndroid='transparent'
					theme={theme}
					{...props}
				/>
			</View>
			{hasCancel ? <CancelButton onCancelPress={onCancelPress} /> : null}
		</View>
	);
};

export default SearchBox;
