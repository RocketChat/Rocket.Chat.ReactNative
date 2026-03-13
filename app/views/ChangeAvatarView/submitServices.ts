import { resetAvatar, setAvatarFromService, saveRoomSettings } from '../../lib/services/restApi';
import log from '../../lib/methods/helpers/log';
import { type IAvatar } from '../../definitions';
import { handleError } from './submitHelpers';

export const changeRoomsAvatar = async (rid: string, roomAvatar: string | null) => {
	try {
		await saveRoomSettings(rid, { roomAvatar });
	} catch (e) {
		log(e);
		return handleError(e, 'changing_avatar');
	}
};

export const changeUserAvatar = async (avatarUpload: IAvatar, server: string, user: { id?: string; token?: string }) => {
	try {
		await setAvatarFromService({ ...avatarUpload, server, user });
	} catch (e) {
		return handleError(e, 'changing_avatar');
	}
};

export const resetUserAvatar = async (userId: string) => {
	try {
		await resetAvatar(userId);
	} catch (e) {
		return handleError(e, 'changing_avatar');
	}
};
