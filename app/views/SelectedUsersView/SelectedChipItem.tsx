import React from 'react';

import { ISelectedUser } from '../../reducers/selectedUsers';
import Chip from '../../containers/Chip';

const SelectedChipItem = ({
	item,
	useRealName,
	onPressItem
}: {
	item: ISelectedUser;
	useRealName: boolean;
	onPressItem: (userItem: ISelectedUser) => void;
}) => {
	console.count(`🧯 RenderSelectedItem ${item.name}`);
	const name = useRealName && item.fname ? item.fname : item.name;
	const username = item.search ? (item.username as string) : item.name;

	return <Chip text={name} avatar={username} onPress={() => onPressItem(item)} testID={`selected-user-${item.name}`} />;
};

export default SelectedChipItem;
