import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { CustomIcon, TIconsName } from '../CustomIcon';
import { ICON_SIZE } from './constants';
import { useTheme } from '../../theme';

export interface IListIcon {
	name: TIconsName;
	color?: string;
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

const ListIcon = ({ name, color, style, testID, size }: IListIcon): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={[styles.icon, style]}>
			<CustomIcon name={name} color={color || colors.fontDefault} size={size ?? ICON_SIZE} testID={testID} />
		</View>
	);
};

ListIcon.displayName = 'List.Icon';

export default ListIcon;
