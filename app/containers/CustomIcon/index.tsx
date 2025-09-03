import React, { memo } from 'react';
import { createIconSetFromIcoMoon } from '@expo/vector-icons';

import { StyleProp, TextStyle } from 'react-native';
import { mappedIcons } from './mappedIcons';
import { useTheme } from '../../theme';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import icoMoonConfig from './selection.json';

export const IconSet = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

const glyphMap = IconSet.getRawGlyphMap
  ? IconSet.getRawGlyphMap()
  : icoMoonConfig.icons?.reduce(
      (map: Record<string, string | number>, glyph: any) => {
        map[glyph.icon.name] = glyph.icon.code;
        return map;
      },
      {}
    ) || {};

export const hasIcon = (name: string) => Object.prototype.hasOwnProperty.call(glyphMap, name);

export type TIconsName = keyof typeof mappedIcons;

export interface ICustomIcon extends React.ComponentProps<typeof IconSet> {
	name: TIconsName;
	size: number;
	color?: string;
	style?: StyleProp<TextStyle>;
}

const CustomIcon = memo(({ name, size, color, style, ...props }: ICustomIcon): React.ReactElement => {
	const { colors } = useTheme();
	const { fontScaleLimited } = useResponsiveLayout();

	const iconSize = size * fontScaleLimited;

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
