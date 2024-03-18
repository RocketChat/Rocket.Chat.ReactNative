import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import Touch from '../../../containers/Touch';
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
	const { colors } = useTheme();
	return (
		<Touch onPress={onPress} style={{ backgroundColor: colors.surfaceRoom }}>
			<View style={styles.container}>
				<Text style={[styles.text, { color: colors.fontSecondaryInfo }]}>{text}</Text>
				{iconName ? <CustomIcon name={iconName} size={22} color={colors.fontSecondaryInfo} /> : null}
			</View>
		</Touch>
	);
});

export default DropdownItem;
