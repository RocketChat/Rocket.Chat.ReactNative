import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { CustomIcon } from '../../containers/CustomIcon';
import Button from '../../containers/Button';

const styles = StyleSheet.create({
	ltsTitle: {
		fontSize: 20,
		lineHeight: 30,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	ltsDescriptionBold: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	ltsDescription: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24,
		...sharedStyles.textRegular
	}
});

export const LTSWarning = () => {
	const { colors } = useTheme();
	// TODO: i18n
	return (
		<View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
			<View style={{ alignItems: 'center', padding: 24 }}>
				<CustomIcon name='warning' size={36} color={colors.dangerColor} />
			</View>
			<Text style={styles.ltsTitle}>Workspace is running an unsupported version of Rocket.Chat</Text>
			<Text style={styles.ltsDescriptionBold}>Mobile and desktop app access to workspace-name will by cyt off in XX days</Text>
			<Text style={styles.ltsDescription}>
				An automatic 30-day warning period has been applied to allow time for a workspace admin to update workspace to a supported
				software version.
			</Text>
			<Button title='Learn more' type='secondary' backgroundColor={'#EEEFF1'} onPress={() => alert('Go to docs!')} />
		</View>
	);
};
