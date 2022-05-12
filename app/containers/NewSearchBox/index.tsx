import React from 'react';
import { StyleSheet, TextInput as RNTextInput, View } from 'react-native';

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

// TODO: Rename this component to searchbox
const NewSearchBox = (): JSX.Element => {
	const { colors } = useTheme();
	return (
		<>
			<View style={styles.container}>
				<View style={[styles.searchBox, { backgroundColor: colors.searchboxBackground }]}>
					<RNTextInput
						autoCapitalize='none'
						autoCorrect={false}
						blurOnSubmit
						placeholder={I18n.t('Search')}
						returnKeyType='search'
						underlineColorAndroid='transparent'
						style={styles.input}
					/>
					<CustomIcon name='search' size={16} color={colors.auxiliaryTintColor} />
					<CustomIcon name='input-clear' size={16} color={colors.auxiliaryTintColor} />
				</View>
			</View>
		</>
	);
};

export default NewSearchBox;
