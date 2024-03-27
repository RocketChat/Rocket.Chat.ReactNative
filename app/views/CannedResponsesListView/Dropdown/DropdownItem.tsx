import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import Touch from '../../../containers/Touch';
import { CustomIcon, TIconsName } from '../../../containers/CustomIcon';
import sharedStyles from '../../Styles';

export const ROW_HEIGHT = 44;

const styles = StyleSheet.create({
	container: {
		paddingVertical: 11,
		height: ROW_HEIGHT,
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
	const { theme } = useTheme();

	return (
		<Touch onPress={onPress} style={{ backgroundColor: themes[theme].surfaceRoom }}>
			<View style={styles.container}>
				<Text style={[styles.text, { color: themes[theme].fontSecondaryInfo }]}>{text}</Text>
				{iconName ? <CustomIcon name={iconName} size={22} color={themes[theme].fontSecondaryInfo} /> : null}
			</View>
		</Touch>
	);
});

export default DropdownItem;
