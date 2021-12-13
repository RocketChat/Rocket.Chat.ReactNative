import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';
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
	iconName: string;
	theme: string;
	onPress: () => void;
}

const DropdownItem = React.memo(({ theme, onPress, iconName, text }: IDropdownItem) => (
	<Touch theme={theme} onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }}>
		<View style={styles.container}>
			<Text style={[styles.text, { color: themes[theme].auxiliaryText }]}>{text}</Text>
			{iconName ? <CustomIcon name={iconName} size={22} color={themes[theme].auxiliaryText} /> : null}
		</View>
	</Touch>
));

export default withTheme(DropdownItem);
