import React from 'react';
import { Text, View } from 'react-native';

import i18n from '../../../../i18n';
import useStyle from './styles';
import AvatarContainer from '../../../Avatar';

const MAX_USERS = 3;

export type TCallUsers = { _id: string; username: string; name: string; avatarETag: string }[];

export const CallParticipants = ({ users }: { users: TCallUsers }): React.ReactElement => {
	const style = useStyle();
	return (
		<>
			{users.map(({ username }, index) =>
				index < MAX_USERS ? <AvatarContainer style={{ marginRight: 4 }} key={index} size={28} text={username} /> : null
			)}
			{users.length > MAX_USERS ? (
				<View style={style.plusUsers}>
					<Text style={style.plusUsersText}>{users.length > 9 ? '+9' : `+${users.length}`}</Text>
				</View>
			) : null}
			<Text style={style.joined}>{i18n.t('Joined')}</Text>
		</>
	);
};
