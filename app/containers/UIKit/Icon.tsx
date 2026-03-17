import React from 'react';
import { StyleSheet, View } from 'react-native';

import { hasIcon, CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import { type IIcon } from './interfaces';

const iconAliases: Record<string, string> = {
	'phone-off': 'phone-end',
	'phone-question-mark': 'phone-issue',
	clock: 'clock-filled',
	'arrow-forward': 'arrow-right',
	info: 'info'
};

const styles = StyleSheet.create({
	frame: {
		width: 32,
		height: 32,
		borderRadius: 8,
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

const getIconColors = (variant: IIcon['variant'], colors: ReturnType<typeof useTheme>['colors']) => {
	switch (variant) {
		case 'danger':
			return {
				icon: colors.fontDanger,
				background: colors.statusBackgroundDanger
			};
		case 'secondary':
			return {
				icon: colors.fontInfo,
				background: colors.statusBackgroundInfo
			};
		case 'warning':
			return {
				icon: colors.statusFontWarning,
				background: colors.statusBackgroundWarning
			};
		default:
			return {
				icon: colors.fontSecondaryInfo,
				background: colors.surfaceTint
			};
	}
};

export const Icon = ({ element }: { element: IIcon }) => {
	const { colors } = useTheme();
	const { icon, variant = 'default', framed } = element;
	const palette = getIconColors(variant, colors);
	const renderedIcon = <CustomIcon name={resolveIconName(icon)} size={20} color={palette.icon} />;

	if (!framed) {
		return renderedIcon;
	}

	return <View style={[styles.frame, { backgroundColor: palette.background }]}>{renderedIcon}</View>;
};
