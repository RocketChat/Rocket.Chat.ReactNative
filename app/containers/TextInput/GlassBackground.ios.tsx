import { Platform, StyleSheet } from 'react-native';
import { Host } from '@expo/ui';
import { Capsule } from '@expo/ui/swift-ui';
import { foregroundStyle, glassEffect } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';

export const supportsLiquidGlass = Number(Platform.Version) >= 26;

const capsuleModifiers = [
	foregroundStyle('clear'),
	glassEffect({ glass: { variant: 'regular', interactive: true }, shape: 'capsule' })
];

export const GlassBackground = () => {
	const { theme } = useTheme();
	return (
		<Host pointerEvents='none' style={StyleSheet.absoluteFill} colorScheme={theme === 'light' ? 'light' : 'dark'}>
			<Capsule modifiers={capsuleModifiers} />
		</Host>
	);
};
