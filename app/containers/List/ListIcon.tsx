import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { themes } from '../../lib/constants';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { useTheme } from '../../theme';
import { ICON_SIZE } from './constants';

interface IListIcon {
	name: TIconsName;
	color?: string | null;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	size?: number;
}

const styles = StyleSheet.create({
	icon: {
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const ListIcon = React.memo(({ name, color, style, testID, size }: IListIcon) => {
	const { theme } = useTheme();

	return (
		<View style={[styles.icon, style]}>
			<CustomIcon name={name} color={color ?? themes[theme].auxiliaryText} size={size ?? ICON_SIZE} testID={testID} />
		</View>
	);
});

ListIcon.displayName = 'List.Icon';

export default ListIcon;
