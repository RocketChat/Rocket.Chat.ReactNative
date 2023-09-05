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
		<View style={[styles.container, { paddingTop: 120 }]}>
			<View style={styles.iconContainer}>
				<CustomIcon name='warning' size={36} color={colors.dangerColor} />
			</View>
			<Text style={[styles.title, { color: colors.bodyText }]}>Workspace is running an unsupported version of Rocket.Chat</Text>
			<Text style={[styles.description, { color: colors.bodyText }]}>
				An admin needs to update the workspace to a supported version in order to reenable access from mobile and desktop apps.
			</Text>
			<Button
				title='Learn more'
				type='secondary'
				backgroundColor={colors.chatComponentBackground}
				onPress={() => alert('Go to docs!')}
			/>
		</View>
	);
};
