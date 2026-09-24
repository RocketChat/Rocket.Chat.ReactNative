import { type ReactElement } from 'react';

import { type SubscriptionType } from '~/definitions';

export interface IRoomContextMenu {
	children: ReactElement;
	enabled: boolean;
	rid: string;
	type: SubscriptionType;
	name: string;
	lastMessage: string;
	isRead: boolean;
	favorite: boolean;
	width: number;
}

const RoomContextMenu = ({ children }: IRoomContextMenu) => children;

export default RoomContextMenu;
