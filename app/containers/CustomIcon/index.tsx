import React from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import { TextProps } from 'react-native';

import { mappedIcons } from './mappedIcons';

const icoMoonConfig = require('./selection.json');

export const IconSet = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

export type TIconsName = keyof typeof mappedIcons;

interface ICustomIcon extends TextProps {
	name: TIconsName;
	size: number;
	color: string;
}

const CustomIcon = ({ name, size, color, ...props }: ICustomIcon) => (
	// @ts-ignore TODO remove this after update @types/react-native to 0.65.0
	<IconSet name={name} size={size} color={color} {...props} />
);
export { CustomIcon };
