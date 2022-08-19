import React, { memo } from 'react';

import { themes } from '../../lib/constants';
import { ISearch, TSubscriptionModel } from '../../definitions';
import UserItemComponent from '../../containers/UserItem';
import { useTheme } from '../../theme';
import { TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import sharedStyles from '../Styles';

type TItem = ISearch | TSubscriptionModel;

export interface IUserItem {
	item: TItem;
	index: number;
	search: TItem[];
	chats: TSubscriptionModel[];
	useRealName: boolean;
	goRoom: (item: TGoRoomItem) => void;
}

const UserItem = memo(
	({ item, index, chats, search, useRealName, goRoom }: IUserItem) => {
		const { theme } = useTheme();

		let style = { borderColor: themes[theme].separatorColor };
		if (index === 0) {
			style = { ...style };
		}
		if (search.length > 0 && index === search.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		if (search.length === 0 && index === chats.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}

		const itemSearch = item as ISearch;
		const itemModel = item as TSubscriptionModel;

		return (
			<UserItemComponent
				name={useRealName && itemSearch.fname ? itemSearch.fname : itemModel.name}
				username={itemSearch.search ? itemSearch.username : itemModel.name}
				onPress={() => goRoom(itemModel)}
				testID={`new-message-view-item-${item.name}`}
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
		if (prevProps.chats.length !== nextProps.chats.length) {
			return false;
		}
		if (prevProps.search.length !== nextProps.search.length) {
			return false;
		}
		return true;
	}
);

export default UserItem;
