import React from 'react';
import createIconSetFromIcoMoon from '@expo/vector-icons/createIconSetFromIcoMoon';
import icoMoonConfig from './selection.json';

import { mappedIcons } from './mappedIcons';
import { useTheme } from '../../theme';
import type { IconProps } from '@expo/vector-icons/build/createIconSet';

export const IconSet = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

export type TIconsName = keyof typeof mappedIcons;

export interface ICustomIcon extends IconProps<string> {
	name: TIconsName;
	size: number;
	color?: string;
}

const CustomIcon = ({ name, size, color, style, ...props }: ICustomIcon): React.ReactElement => {
	const { colors } = useTheme();
	return <IconSet name={name} size={size} color={color || colors.fontDefault} style={[{ lineHeight: size }, style]} {...props} />;
};

export { CustomIcon };
