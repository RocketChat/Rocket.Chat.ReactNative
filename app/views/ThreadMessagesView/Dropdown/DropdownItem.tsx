import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import Touch from '../../../lib/methods/helpers/touch';
import { CustomIcon, TIconsName } from '../../../containers/CustomIcon';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
		minHeight: 40,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	text: {
		flex: 1,
		fontSize: 16,
		...sharedStyles.textRegular
	}
});

interface IDropdownItem {
	text: string;
	iconName: TIconsName | null;
	onPress: () => void;
}

const DropdownItem = React.memo(({ onPress, iconName, text }: IDropdownItem) => {
	const { colors, theme } = useTheme();
	return (
		<Touch theme={theme} onPress={onPress} style={{ backgroundColor: colors.backgroundColor }}>
			<View style={styles.container}>
				<Text style={[styles.text, { color: colors.auxiliaryText }]}>{text}</Text>
				{iconName ? <CustomIcon name={iconName} size={22} color={colors.auxiliaryText} /> : null}
			</View>
		</Touch>
	);
});

export default DropdownItem;
