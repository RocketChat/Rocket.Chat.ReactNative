import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';

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
