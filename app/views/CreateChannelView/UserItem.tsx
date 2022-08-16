import React, { memo } from 'react';
import { shallowEqual } from 'react-redux';

import Chip from '../../containers/Chip';

export interface IOtherUser {
	_id: string;
	name: string;
	fname: string;
}

export const UserItem = memo(
	({ item, removeUser, useRealName }: { item: IOtherUser; useRealName: boolean; removeUser: (item: IOtherUser) => void }) => {
		const name = useRealName && item.fname ? item.fname : item.name;
		const username = item.name;

		return (
			<Chip text={name} avatar={username} onPress={() => removeUser(item)} testID={`create-channel-view-item-${item.name}`} />
		);
	},
	shallowEqual
);
