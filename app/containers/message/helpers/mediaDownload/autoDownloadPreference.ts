import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';

import {
	IMAGES_PREFERENCE_DOWNLOAD,
	AUDIO_PREFERENCE_DOWNLOAD,
	VIDEO_PREFERENCE_DOWNLOAD,
	MediaDownloadOption
} from '../../../../lib/constants';
import userPreferences from '../../../../lib/methods/userPreferences';
import { IUser, IUserMessage } from '../../../../definitions';

type TMediaType = typeof IMAGES_PREFERENCE_DOWNLOAD | typeof AUDIO_PREFERENCE_DOWNLOAD | typeof VIDEO_PREFERENCE_DOWNLOAD;
interface IUsersParam {
	user: IUser;
	author?: IUserMessage;
}

export const isAutoDownloadEnabled = async (mediaType: TMediaType, { author, user }: IUsersParam) => {
	const mediaDownloadPreference = userPreferences.getString(mediaType);
	const netInfoState = await NetInfo.fetch();

	return (
		(mediaDownloadPreference === MediaDownloadOption.WIFI && netInfoState.type === NetInfoStateType.wifi) ||
		mediaDownloadPreference === MediaDownloadOption.WIFI_MOBILE_DATA ||
		author?._id === user.id
	);
};
