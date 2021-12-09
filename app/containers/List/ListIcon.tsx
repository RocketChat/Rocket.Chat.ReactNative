import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';
import { ICON_SIZE } from './constants';

interface IListIcon {
	theme?: string;
	name: string;
	color?: string;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}

const styles = StyleSheet.create({
	icon: {
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const ListIcon = React.memo(({ theme, name, color, style, testID }: IListIcon) => (
	<View style={[styles.icon, style]}>
		<CustomIcon name={name} color={color ?? themes[theme!].auxiliaryText} size={ICON_SIZE} testID={testID} />
	</View>
));

ListIcon.displayName = 'List.Icon';

export default withTheme(ListIcon);
