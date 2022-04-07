import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';
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
	iconName: string | null;
	onPress: () => void;
}

const DropdownItem = React.memo(({ onPress, iconName, text }: IDropdownItem) => {
	const { theme } = useTheme();

	return (
		<Touch theme={theme} onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }}>
			<View style={styles.container}>
				<Text style={[styles.text, { color: themes[theme].auxiliaryText }]}>{text}</Text>
				{iconName ? <CustomIcon name={iconName} size={22} color={themes[theme].auxiliaryText} /> : null}
			</View>
		</Touch>
	);
});

export default DropdownItem;
