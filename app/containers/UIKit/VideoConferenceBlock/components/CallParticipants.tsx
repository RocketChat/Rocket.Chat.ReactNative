import { type ReactElement } from 'react';
import { View } from 'react-native';
import { PlainText } from 'react-native-plain-text';

import i18n from '~/i18n';
import useStyle from './styles';
import AvatarContainer from '~/containers/Avatar';

const MAX_USERS = 3;

export type TCallUsers = { _id: string; username: string; name: string; avatarETag: string }[];

export const CallParticipants = ({ users }: { users: TCallUsers }): ReactElement => {
	const style = useStyle();
	return (
		<>
			{users.map(({ username }, index) =>
				index < MAX_USERS ? <AvatarContainer style={{ marginRight: 4 }} key={index} size={28} text={username} /> : null
			)}
			{users.length > MAX_USERS ? (
				<View style={style.plusUsers}>
					<PlainText style={style.plusUsersText}>{users.length > 9 ? '+9' : `+${users.length}`}</PlainText>
				</View>
			) : null}
			<PlainText style={style.joined}>{i18n.t('Joined')}</PlainText>
		</>
	);
};
