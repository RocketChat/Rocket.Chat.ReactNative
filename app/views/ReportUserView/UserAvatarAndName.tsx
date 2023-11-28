import React from 'react';
import { Text, View } from 'react-native';

import Avatar from '../../containers/Avatar';
import styles from './styles';
import { useTheme } from '../../theme';

const UserAvatarAndName = ({ username, rid, name }: { username: string; rid?: string; name: string }) => {
	const { colors } = useTheme();

	return (
		<View style={styles.containerAvatarAndName}>
			<Avatar text={username} rid={rid} size={32} />
			<Text style={[styles.nameText, { color: colors.fontDefault }]} numberOfLines={1}>
				{name || username}
			</Text>
		</View>
	);
};

export default UserAvatarAndName;
