import React, { memo } from 'react';

import { ISelectedUser } from '../../reducers/selectedUsers';
import Chip from '../../containers/Chip';

const SelectedChipItem = memo(
	({
		item,
		useRealName,
		onPressItem
	}: {
		item: ISelectedUser;
		useRealName: boolean;
		onPressItem: (userItem: ISelectedUser) => void;
	}) => {
		const name = useRealName && item.fname ? item.fname : item.name;
		const username = item.search ? (item.username as string) : item.name;

		return <Chip text={name} avatar={username} onPress={() => onPressItem(item)} testID={`selected-user-${item.name}`} />;
	},
	(prevProps, nextProps) => {
		if (prevProps.item?.name !== nextProps.item?.name) {
			return false;
		}
		if (prevProps.item?.fname !== nextProps.item?.fname) {
			return false;
		}
		if (prevProps.useRealName !== nextProps.useRealName) {
			return false;
		}
		return true;
	}
);

export default SelectedChipItem;
