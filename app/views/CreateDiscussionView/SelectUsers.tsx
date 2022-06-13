import React, { useState } from 'react';
import { Text } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { getAvatarURL } from '../../lib/methods/helpers/getAvatarUrl';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { themes } from '../../lib/constants';
import styles from './styles';
import { ICreateDiscussionViewSelectUsers } from './interfaces';
import { SubscriptionType, IUser } from '../../definitions';
import { search } from '../../lib/methods';
import { getRoomAvatar, getRoomTitle, debounce } from '../../lib/methods/helpers';

const SelectUsers = ({
	server,
	token,
	userId,
	selected,
	onUserSelect,
	blockUnauthenticatedAccess,
	serverVersion,
	theme
}: ICreateDiscussionViewSelectUsers): React.ReactElement => {
	const [users, setUsers] = useState<any[]>([]);

	const getUsers = debounce(async (keyword = '') => {
		try {
			const res = await search({ text: keyword, filterRooms: false });
			const selectedUsers = users.filter((u: IUser) => selected.includes(u.name));
			const filteredUsers = res.filter(r => !selectedUsers.find((u: IUser) => u.name === r.name));
			const items = [...selectedUsers, ...filteredUsers];
			setUsers(items);
		} catch {
			// do nothing
		}
	}, 300);

	const getAvatar = (item: IUser) =>
		getAvatarURL({
			text: getRoomAvatar(item),
			type: SubscriptionType.DIRECT,
			userId,
			token,
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
				context={BlockContext.FORM}
				multiselect
			/>
		</>
	);
};

export default SelectUsers;
