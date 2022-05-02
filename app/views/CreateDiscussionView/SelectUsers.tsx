import React, { useState } from 'react';
import { Text } from 'react-native';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import debounce from '../../utils/debounce';
import { avatarURL } from '../../utils/avatar';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { themes } from '../../lib/constants';
import styles from './styles';
import { ICreateDiscussionViewSelectUsers } from './interfaces';
import { SubscriptionType } from '../../definitions/ISubscription';
import { getRoomAvatar, getRoomTitle, search } from '../../lib/methods';

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
			const res = await search({ text: keyword, filterRooms: false });
			const selectedUsers = users.filter((u: IUser) => selected.includes(u.name));
			const filteredUsers = res.filter(r => !users.find((u: IUser) => u.name === r.name));
			const items = [...selectedUsers, ...filteredUsers];
			setUsers(items);
		} catch {
			// do nothing
		}
	}, 300);

	const getAvatar = (item: any) =>
		avatarURL({
			text: getRoomAvatar(item),
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
					text: { text: getRoomTitle(user) },
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
