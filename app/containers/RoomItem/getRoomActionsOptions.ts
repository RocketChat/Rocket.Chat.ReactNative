import I18n from '../../i18n';
import { toggleFav } from '../../lib/methods/toggleFav';
import { toggleRead } from '../../lib/methods/toggleRead';
import { hideRoom } from '../../lib/methods/hideRoom';
import { type TActionSheetOptionsItem } from '../ActionSheet';
import { type SubscriptionType } from '../../definitions';

export interface IRoomActionsParams {
	rid: string;
	type: SubscriptionType;
	isRead: boolean;
	favorite: boolean;
	serverVersion: string;
}

export const getRoomActionsOptions = ({
	rid,
	type,
	isRead,
	favorite,
	serverVersion
}: IRoomActionsParams): TActionSheetOptionsItem[] => [
	{
		title: I18n.t(isRead ? 'Mark_unread' : 'Mark_read'),
		icon: isRead ? 'flag' : 'check',
		onPress: () => toggleRead(rid, isRead, serverVersion),
		testID: `action-sheet-${isRead ? 'mark-unread' : 'mark-read'}`
	},
	{
		title: I18n.t(favorite ? 'Unfavorite' : 'Favorite'),
		icon: favorite ? 'star-filled' : 'star',
		onPress: () => toggleFav(rid, favorite),
		testID: `action-sheet-${favorite ? 'unfavorite' : 'favorite'}`
	},
	{
		title: I18n.t('Hide'),
		icon: 'unread-on-top-disabled',
		onPress: () => hideRoom(rid, type),
		testID: 'action-sheet-hide'
	}
];
