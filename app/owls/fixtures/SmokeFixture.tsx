import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../lib/constants/colors';

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		backgroundColor: colors.light.surfaceTint
	},
	content: {
		padding: 24,
		gap: 16
	},
	header: {
		gap: 6
	},
	eyebrow: {
		color: colors.light.fontInfo,
		fontSize: 13,
		fontWeight: '700',
		letterSpacing: 1,
		textTransform: 'uppercase'
	},
	title: {
		color: colors.light.fontTitlesLabels,
		fontSize: 28,
		fontWeight: '700'
	},
	subtitle: {
		color: colors.light.fontSecondaryInfo,
		fontSize: 16,
		lineHeight: 24
	},
	card: {
		backgroundColor: colors.light.surfaceRoom,
		borderColor: colors.light.strokeExtraLight,
		borderRadius: 20,
		borderWidth: 1,
		padding: 20,
		gap: 16
	},
	cardHeader: {
		gap: 8
	},
	cardTitle: {
		color: colors.light.fontTitlesLabels,
		fontSize: 20,
		fontWeight: '700'
	},
	cardBody: {
		color: colors.light.fontDefault,
		fontSize: 15,
		lineHeight: 22
	},
	statsRow: {
		flexDirection: 'row',
		gap: 12
	},
	stat: {
		flex: 1,
		backgroundColor: colors.light.surfaceHover,
		borderRadius: 14,
		padding: 12
	},
	statLabel: {
		color: colors.light.fontHint,
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase'
	},
	statValue: {
		color: colors.light.fontTitlesLabels,
		fontSize: 20,
		fontWeight: '700',
		marginTop: 6
	},
	cta: {
		alignItems: 'center',
		backgroundColor: colors.light.buttonBackgroundPrimaryDefault,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 14
	},
	ctaPressed: {
		backgroundColor: colors.light.buttonBackgroundPrimaryPress
	},
	ctaLabel: {
		color: colors.light.buttonFontPrimary,
		fontSize: 16,
		fontWeight: '700'
	},
	expandedPanel: {
		backgroundColor: colors.light.statusBackgroundInfo,
		borderRadius: 14,
		padding: 16,
		gap: 8
	},
	expandedTitle: {
		color: colors.light.statusFontInfo,
		fontSize: 16,
		fontWeight: '700'
	},
	expandedBody: {
		color: colors.light.fontDefault,
		fontSize: 14,
		lineHeight: 20
	}
});

const stats = [
	{ label: 'Alerts', value: '03' },
	{ label: 'Unread', value: '12' },
	{ label: 'Rooms', value: '128' }
];

const SmokeFixture = () => {
	const [expanded, setExpanded] = React.useState(false);

	return (
		<ScrollView style={styles.scrollView} contentContainerStyle={styles.content} testID='owl-smoke-scroll'>
			<View style={styles.header}>
				<Text style={styles.eyebrow}>Visual Regression Harness</Text>
				<Text style={styles.title}>Rocket.Chat mobile fixture</Text>
				<Text style={styles.subtitle}>
					This isolated surface is intentionally deterministic so new Owl regressions can land without depending on login, sync or
					live server data.
				</Text>
			</View>

			<View style={styles.card} testID='owl-smoke-root'>
				<View style={styles.cardHeader}>
					<Text style={styles.cardTitle}>Smoke fixture</Text>
					<Text style={styles.cardBody}>
						Use this as the first committed baseline, then add focused fixtures beside it for each regression under test.
					</Text>
				</View>

				<View style={styles.statsRow}>
					{stats.map(stat => (
						<View key={stat.label} style={styles.stat}>
							<Text style={styles.statLabel}>{stat.label}</Text>
							<Text style={styles.statValue}>{stat.value}</Text>
						</View>
					))}
				</View>

				<Pressable
					accessibilityRole='button'
					onPress={() => setExpanded(value => !value)}
					style={({ pressed }) => [styles.cta, (pressed || expanded) && styles.ctaPressed]}
					testID='owl-smoke-toggle'>
					<Text style={styles.ctaLabel}>{expanded ? 'Hide regression details' : 'Show regression details'}</Text>
				</Pressable>

				{expanded ? (
					<View style={styles.expandedPanel} testID='owl-smoke-expanded'>
						<Text style={styles.expandedTitle}>Expanded state</Text>
						<Text style={styles.expandedBody}>
							This second state exists to prove Owl can drive the fixture and compare more than one screenshot in CI.
						</Text>
					</View>
				) : null}
			</View>
		</ScrollView>
	);
};

export default SmokeFixture;
