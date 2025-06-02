import React, { memo } from 'react';
import { useWindowDimensions } from 'react-native';
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

const CustomIcon = memo(({ name, size, color, style, ...props }: ICustomIcon): React.ReactElement => {
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();
	const fontScaleLimit = 1.4;
	const iconSize = size * (fontScale > fontScaleLimit ? fontScaleLimit : fontScale);

	return (
		<IconSet
			name={name}
			size={iconSize}
			color={color || colors.fontDefault}
			style={[{ lineHeight: iconSize }, style]}
			{...props}
		/>
	);
});

export { CustomIcon };
