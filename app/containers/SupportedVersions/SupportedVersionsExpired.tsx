import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';

export const SupportedVersionsExpired = () => {
	const { colors } = useTheme();
	// TODO: i18n
	return (
		<View style={{ flex: 1, paddingTop: 120, padding: 16 }}>
			<View style={{ alignItems: 'center', padding: 24 }}>
				<CustomIcon name='warning' size={36} color={colors.dangerColor} />
			</View>
			<Text style={styles.title}>Workspace is running an unsupported version of Rocket.Chat</Text>
			<Text style={styles.description}>
				An admin needs to update the workspace to a supported version in order to reenable access from mobile and desktop apps.
			</Text>
			<Button title='Learn more' type='secondary' backgroundColor={'#EEEFF1'} onPress={() => alert('Go to docs!')} />
		</View>
	);
};
