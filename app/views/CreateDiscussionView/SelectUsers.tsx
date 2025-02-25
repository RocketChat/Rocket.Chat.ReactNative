import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { getAvatarURL } from '../../lib/methods/helpers/getAvatarUrl';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import styles from './styles';
import { ICreateDiscussionViewSelectUsers } from './interfaces';
import { SubscriptionType, IUser } from '../../definitions';
import { search } from '../../lib/methods';
import { getRoomAvatar, getRoomTitle } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';

const SelectUsers = ({
	server,
	token,
	userId,
	selected,
	onUserSelect,
	blockUnauthenticatedAccess,
	serverVersion
}: ICreateDiscussionViewSelectUsers): React.ReactElement => {
	const [users, setUsers] = useState<any[]>([]);
	const { colors } = useTheme();

	const getUsers = async (keyword = '') => {
		try {
			const res = await search({ text: keyword, filterRooms: false });
			const selectedUsers = users.filter((u: IUser) => selected.includes(u.name));
			const filteredUsers = res.filter(r => !selectedUsers.find((u: IUser) => u.name === r.name));
			const items = [...selectedUsers, ...filteredUsers];
			setUsers(items);
			return items.map((user: IUser) => ({
				value: user.name,
				text: { text: getRoomTitle(user) },
				imageUrl: getAvatar(user)
			}));
		} catch {
			// do nothing
		}
	};

	useEffect(() => {
		getUsers('');
	}, []);

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
		<View accessibilityLabel={I18n.t('Invite_users')}>
			<Text style={[styles.label, { color: colors.fontTitlesLabels }]}>{I18n.t('Invite_users')}</Text>
			<MultiSelect
				inputStyle={styles.inputStyle}
				onSearch={getUsers}
				onChange={onUserSelect}
				options={users.map((user: IUser) => ({
					value: user.name,
					text: { text: getRoomTitle(user) },
					imageUrl: getAvatar(user)
				}))}
				placeholder={{ text: I18n.t('Select_Users') }}
				context={BlockContext.FORM}
				multiselect
			/>
		</View>
	);
};

export default SelectUsers;
