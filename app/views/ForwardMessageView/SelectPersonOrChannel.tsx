import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { getAvatarURL } from '../../lib/methods/helpers/getAvatarUrl';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import styles from './styles';
import { ICreateDiscussionViewSelectUsers } from './interfaces';
import { SubscriptionType, IUser, ISearchLocal } from '../../definitions';
import { localSearchSubscription, search } from '../../lib/methods';
import { getRoomAvatar, getRoomTitle } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';

const SelectPersonOrChannel = ({
	server,
	token,
	userId,
	selected,
	onUserSelect,
	blockUnauthenticatedAccess,
	serverVersion
}: ICreateDiscussionViewSelectUsers): React.ReactElement => {
	const [users, setUsers] = useState<any[]>([]);
	const [channels, setChannels] = useState<ISearchLocal[]>([]);
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

	const getChannels = async (keyword = '') => {
		try {
			const res = (await localSearchSubscription({ text: keyword, filterUsers: false })) as ISearchLocal[];
			setChannels(res);
			return res.map(channel => ({
				value: channel,
				text: { text: getRoomTitle(channel) },
				imageUrl: getAvatar(channel)
			}));
		} catch {
			// do nothing
		}
	};

	useEffect(() => {
		getChannels('');
	}, []);

	useEffect(() => {
		getUsers('');
	}, []);

	const getAvatar = (item: IUser | ISearchLocal) =>
		getAvatarURL({
			text: getRoomAvatar(item),
			type: 'rid' in item ? item.t : SubscriptionType.DIRECT,
			userId,
			token,
			server,
			avatarETag: item.avatarETag,
			rid: 'rid' in item ? item.rid : undefined,
			blockUnauthenticatedAccess,
			serverVersion
		});

	return (
		<>
			<Text style={[styles.label, { color: colors.titleText }]}>{I18n.t('Person_or_channel')}</Text>
			<MultiSelect
				inputStyle={styles.inputStyle}
				onSearch={getUsers}
				onChange={onUserSelect}
				options={users.map((user: IUser) => ({
					value: user.name,
					text: { text: getRoomTitle(user) },
					imageUrl: getAvatar(user)
				}))}
				placeholder={{ text: `${I18n.t('Select')}` }}
				context={BlockContext.FORM}
				multiselect
			/>
		</>
	);
};

export default SelectPersonOrChannel;
