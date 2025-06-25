import React, { memo } from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import type { IconProps } from 'react-native-vector-icons/Icon';

import { mappedIcons } from './mappedIcons';
import { useTheme } from '../../theme';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout';

const icoMoonConfig = require('./selection.json');

export const IconSet = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

export type TIconsName = keyof typeof mappedIcons;

export interface ICustomIcon extends IconProps {
	name: TIconsName;
	size: number;
	color?: string;
}

const FONT_SCALE_LIMIT = 1.3;

const CustomIcon = memo(({ name, size, color, style, ...props }: ICustomIcon): React.ReactElement => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();

	const iconSize = size * (fontScale > FONT_SCALE_LIMIT ? FONT_SCALE_LIMIT : fontScale);

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
