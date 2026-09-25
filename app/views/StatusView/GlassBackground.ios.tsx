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

const styles = StyleSheet.create({
	background: {
		...StyleSheet.absoluteFill,
		zIndex: -1
	}
});

export const GlassBackground = () => {
	const { theme } = useTheme();
	return (
		<Host pointerEvents='none' style={styles.background} colorScheme={theme === 'light' ? 'light' : 'dark'}>
			<Capsule modifiers={capsuleModifiers} />
		</Host>
	);
};
