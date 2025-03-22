import React from 'react';
import { Text, View } from 'react-native';

import Avatar from '../../containers/Avatar';
import styles from './styles';
import { useTheme } from '../../theme';

const UserInfo = ({ username, name }: { username: string; name: string }) => {
	const { colors } = useTheme();

	return (
		<View style={styles.containerAvatarAndName}>
			<Avatar text={username} size={32} />
			<Text style={[styles.nameText, { color: colors.fontDefault }]} numberOfLines={1}>
				{name || username}
			</Text>
		</View>
	);
};

export default UserInfo;
