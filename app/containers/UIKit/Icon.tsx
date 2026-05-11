import React from 'react';
import { StyleSheet, View } from 'react-native';

import { hasIcon, CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import { type IIcon } from './interfaces';

const iconAliases: Record<string, string> = {
	'phone-end': 'phone-off',
	microphone: 'mic',
	'microphone-disabled': 'mic-off',
	audio: 'volume',
	'audio-disabled': 'volume-off'
};

const styles = StyleSheet.create({
	frame: {
		width: 28,
		height: 28,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export const resolveIconName = (icon: string) => {
	if (hasIcon(icon)) {
		return icon as any;
	}

	const aliasedIcon = iconAliases[icon];
	if (aliasedIcon && hasIcon(aliasedIcon)) {
		return aliasedIcon as any;
	}

	return 'info' as any;
};

const getIconColor = (variant: IIcon['variant'], colors: ReturnType<typeof useTheme>['colors'], framed?: boolean) => {
	switch (variant) {
		case 'danger':
			return framed ? colors.statusFontDanger : colors.fontDanger;
		case 'secondary':
			return colors.fontSecondaryInfo;
		case 'warning':
			return colors.statusFontWarning;
		default:
			return colors.fontDefault;
	}
};

export const Icon = ({ element }: { element: IIcon }) => {
	const { colors } = useTheme();
	const { icon, variant = 'default', framed } = element;
	const color = getIconColor(variant, colors, framed);
	const renderedIcon = <CustomIcon name={resolveIconName(icon)} size={20} color={color} />;

	if (!framed) {
		return renderedIcon;
	}

	return <View style={[styles.frame, { backgroundColor: colors.surfaceTint }]}>{renderedIcon}</View>;
};
