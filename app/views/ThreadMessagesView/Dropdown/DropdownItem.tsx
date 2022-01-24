import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';
import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';
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
	iconName: string | null;
	theme?: string;
	onPress: () => void;
}

const DropdownItem = React.memo(({ theme, onPress, iconName, text }: IDropdownItem) => (
	<Touch theme={theme!} onPress={onPress} style={{ backgroundColor: themes[theme!].backgroundColor }}>
		<View style={styles.container}>
			<Text style={[styles.text, { color: themes[theme!].auxiliaryText }]}>{text}</Text>
			{iconName ? <CustomIcon name={iconName} size={22} color={themes[theme!].auxiliaryText} /> : null}
		</View>
	</Touch>
));

export default withTheme(DropdownItem);
