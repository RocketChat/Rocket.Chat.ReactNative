import React from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import { TextProps } from 'react-native';

import { mappedIcons } from './mappedIcons';

const icoMoonConfig = require('./selection.json');

export const IconSet = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

export type TIconsName = keyof typeof mappedIcons;

export interface ICustomIcon extends TextProps {
	name: TIconsName;
	size: number;
	color: string;
}

const CustomIcon = ({ name, size, color, style, ...props }: ICustomIcon) => (
	// @ts-ignore TODO remove this after update @types/react-native to 0.65.0
	<IconSet name={name} size={size} color={color} style={[{ lineHeight: size }, style]} {...props} />
);
export { CustomIcon };
