import React from 'react';
import { Text, View } from 'react-native';

import Avatar from '../../containers/Avatar';
import styles from './styles';
import { useTheme } from '../../theme';

interface UserInfoProps {
	username: string;
	name: string;
}

const UserInfo = ({ username, name }: UserInfoProps) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.containerAvatarAndName, { backgroundColor: colors.strokeExtraLight }]}>
			<Avatar text={username} size={40} borderRadius={8} />
			<View style={styles.userTextContainer}>
				<Text style={[styles.nameText, { color: colors.fontDefault }]} numberOfLines={1}>
					{name || username}
				</Text>
				{username && (
					<Text style={[styles.usernameText, { color: colors.fontDanger }]} numberOfLines={1}>
						@{username}
					</Text>
				)}
			</View>
		</View>
	);
};

export default UserInfo;
