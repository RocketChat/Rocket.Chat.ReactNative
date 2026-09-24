import { Platform, StyleSheet } from 'react-native';
import { Host } from '@expo/ui';
import { Capsule } from '@expo/ui/swift-ui';
import { foregroundStyle, glassEffect } from '@expo/ui/swift-ui/modifiers';

export const supportsLiquidGlass = Number(Platform.Version) >= 26;

const capsuleModifiers = [
	foregroundStyle('clear'),
	glassEffect({ glass: { variant: 'regular', interactive: true }, shape: 'capsule' })
];

export const GlassBackground = () => (
	<Host pointerEvents='none' style={StyleSheet.absoluteFill}>
		<Capsule modifiers={capsuleModifiers} />
	</Host>
);
