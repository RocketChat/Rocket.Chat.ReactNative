import React, { useState } from 'react';
import { Text } from 'react-native';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import debounce from '../../utils/debounce';
import { avatarURL } from '../../utils/avatar';
import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { themes } from '../../lib/constants';
import styles from './styles';
import { ICreateDiscussionViewSelectUsers } from './interfaces';
import { SubscriptionType } from '../../definitions/ISubscription';

interface IUser {
	name: string;
	username: string;
}

const SelectUsers = ({
	server,
	token,
	userId,
	selected,
	onUserSelect,
	blockUnauthenticatedAccess,
	serverVersion,
	theme
}: ICreateDiscussionViewSelectUsers): JSX.Element => {
	const [users, setUsers] = useState<any[]>([]);

	const getUsers = debounce(async (keyword = '') => {
		try {
			const res = await RocketChat.search({ text: keyword, filterRooms: false });
			setUsers(res);
		} catch {
			// do nothing
		}
	}, 300);

	const getAvatar = (item: any) =>
		avatarURL({
			text: RocketChat.getRoomAvatar(item),
			type: SubscriptionType.DIRECT,
			user: { id: userId, token },
			server,
			avatarETag: item.avatarETag,
			blockUnauthenticatedAccess,
			serverVersion
		});

	return (
		<>
			<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t('Invite_users')}</Text>
			<MultiSelect
				inputStyle={styles.inputStyle}
				onSearch={getUsers}
				onChange={onUserSelect}
				options={users.map((user: IUser) => ({
					value: user.name,
					text: { text: RocketChat.getRoomTitle(user) },
					imageUrl: getAvatar(user)
				}))}
				onClose={() => setUsers(users.filter((u: IUser) => selected.includes(u.name)))}
				placeholder={{ text: `${I18n.t('Select_Users')}...` }}
				context={BLOCK_CONTEXT.FORM}
				multiselect
			/>
		</>
	);
};

export default SelectUsers;
