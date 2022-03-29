import React from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import { StyleProp, TextProps, TextStyle } from 'react-native';

import { glyphIcoMoon } from './glyphIcoMoon';

const icoMoonConfig = require('./selection.json');

export const IconMoon = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

interface ICustomIcon {
	name: keyof typeof glyphIcoMoon;
	size: number;
	color?: string;
	testID?: string | null;
	style?: StyleProp<TextStyle>;
	onPress?: TextProps['onPress'];
}

const CustomIcon = ({ name, size, color, testID, style, ...props }: ICustomIcon) => (
	<IconMoon name={name} size={size} color={color} testID={testID || undefined} {...props} />
);
export { CustomIcon };
