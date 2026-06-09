import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../lib/constants/colors';
import SmokeFixture from './SmokeFixture';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.light.surfaceTint,
		padding: 24
	},
	title: {
		color: colors.light.fontDanger,
		fontSize: 20,
		fontWeight: '700',
		textAlign: 'center'
	},
	body: {
		color: colors.light.fontSecondaryInfo,
		fontSize: 15,
		lineHeight: 22,
		marginTop: 8,
		textAlign: 'center'
	}
});

const fixtures = {
	smoke: SmokeFixture
};

const UnknownFixture = ({ fixture }: { fixture: string }) => (
	<View style={styles.container} testID='owl-unknown-fixture'>
		<Text style={styles.title}>Unknown Owl fixture</Text>
		<Text style={styles.body}>{`No visual regression fixture is registered for "${fixture}".`}</Text>
	</View>
);

type FixtureName = keyof typeof fixtures;

export const renderOwlFixture = (fixture?: string): React.ReactNode => {
	if (!fixture) {
		return <SmokeFixture />;
	}

	const resolvedFixture = fixtures[fixture as FixtureName];
	if (resolvedFixture) {
		const ResolvedFixture = resolvedFixture;
		return <ResolvedFixture />;
	}

	return <UnknownFixture fixture={fixture} />;
};
