import React from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import type { IconProps } from 'react-native-vector-icons/Icon';

import { mappedIcons } from './mappedIcons';
import { useTheme } from '../../theme';

const icoMoonConfig = require('./selection.json');

export const IconSet = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

export type TIconsName = keyof typeof mappedIcons;

export interface ICustomIcon extends IconProps {
	name: TIconsName;
	size: number;
	color?: string;
}

const CustomIcon = ({ name, size, color, style, ...props }: ICustomIcon): React.ReactElement => {
	const { colors } = useTheme();
	return <IconSet name={name} size={size} color={color || colors.fontDefault} style={[{ lineHeight: size }, style]} {...props} />;
};

export { CustomIcon };
