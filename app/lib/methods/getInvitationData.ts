import { type IInviteSubscription } from '../../definitions';
import I18n from '../../i18n';
import { getRoomTitle } from './helpers';
import { replyRoomInvite } from './replyRoomInvite';

export const getInvitationData = (room: IInviteSubscription) => {
	const title =
		room.t === 'd'
			? I18n.t('invited_room_title_dm')
			: I18n.t('invited_room_title_channel', { room_name: getRoomTitle(room).slice(0, 30) });

	const description = room.t === 'd' ? I18n.t('invited_room_description_dm') : I18n.t('invited_room_description_channel');

	return {
		title,
		description,
		inviter: room.inviter,
		accept: () => replyRoomInvite(room.id, 'accept'),
		reject: () => replyRoomInvite(room.id, 'reject')
	};
};
