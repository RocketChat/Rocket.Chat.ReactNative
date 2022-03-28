import React from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import { StyleProp, TextProps, TextStyle } from 'react-native';

const icoMoonConfig = require('./selection.json');
const glyphIcoMoon = require('./glyphIcoMoon.json');

export const IconMoon = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

type TIconNames = keyof typeof glyphIcoMoon;
interface ICustomIcon {
	name: TIconNames;
	size: number;
	color?: string;
	testID?: string | null;
	style?: StyleProp<TextStyle>;
	onPress?: TextProps['onPress'];
}

const CustomIcon = ({ name, size, color, testID, style, ...props }: ICustomIcon) => (
	<IconMoon name={name as string} size={size} color={color} testID={testID || undefined} {...props} />
);
export { CustomIcon };
