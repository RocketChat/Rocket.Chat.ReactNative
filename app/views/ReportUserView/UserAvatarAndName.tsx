import React from 'react';
import { View } from 'react-native';

import Avatar from '../../containers/Avatar';
import styles from './styles';

const UserAvatarAndName = ({ username, rid, name }: { username: string; rid?: string; name: string }) => {
	console.log('🚀 ~ file: UserAvatarAndName.tsx:13 ~ UserAvatarAndName ~ {username, rid}:', { username, rid, name });

	return (
		<View style={styles.containerAvatarAndName}>
			<Avatar text={username} rid={rid} size={32} />
		</View>
	);
};

export default UserAvatarAndName;
