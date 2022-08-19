import React, { memo } from 'react';

import UserItemComponent from '../../containers/UserItem';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';

interface IUserItem {
	item: ISelectedUser;
	index: number;
	name: string;
	username: string;
	searchLength: number;
	chatsLength: number;
	isChecked: boolean;
	onPressItem: (item: ISelectedUser) => void;
}

const UserItem = memo(
	({ item, index, searchLength, chatsLength, isChecked, name, username, onPressItem }: IUserItem) => {
		const { theme, colors } = useTheme();

		let style = { borderColor: colors.separatorColor };
		if (index === 0) {
			style = { ...style, ...sharedStyles.separatorTop };
		}
		if (searchLength > 0 && index === searchLength - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		if (searchLength === 0 && index === chatsLength - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		return (
			<UserItemComponent
				name={name}
				username={username}
				onPress={() => onPressItem(item)}
				testID={`select-users-view-item-${item.name}`}
				icon={isChecked ? 'checkbox-checked' : 'checkbox-unchecked'}
				iconColor={isChecked ? colors.actionTintColor : colors.separatorColor}
				style={style}
				theme={theme}
			/>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.item?.name !== nextProps.item?.name) {
			return false;
		}
		if (prevProps.item?.fname !== nextProps.item?.fname) {
			return false;
		}
		if (prevProps.chatsLength !== nextProps.chatsLength) {
			return false;
		}
		if (prevProps.searchLength !== nextProps.searchLength) {
			return false;
		}
		if (prevProps.isChecked !== nextProps.isChecked) {
			return false;
		}
		if (prevProps.index !== nextProps.index) {
			return false;
		}
		return true;
	}
);

export default UserItem;
