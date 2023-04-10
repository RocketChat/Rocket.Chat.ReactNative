import { Services } from '../../lib/services';
import log from '../../lib/methods/helpers/log';
import { IAvatar } from '../../definitions';
import { handleError } from './submitHelpers';

export const changeRoomsAvatar = async (rid: string, roomAvatar: string | null) => {
	try {
		await Services.saveRoomSettings(rid, { roomAvatar });
	} catch (e) {
		log(e);
		return handleError(e, 'changing_avatar');
	}
};

export const changeUserAvatar = async (avatarUpload: IAvatar) => {
	try {
		await Services.setAvatarFromService(avatarUpload);
	} catch (e) {
		return handleError(e, 'changing_avatar');
	}
};

export const resetUserAvatar = async (userId: string) => {
	try {
		await Services.resetAvatar(userId);
	} catch (e) {
		return handleError(e, 'changing_avatar');
	}
};
