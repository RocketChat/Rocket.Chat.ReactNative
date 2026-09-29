import { type IUpload, type TSendFileMessageFileInfo, type IUser } from '~/definitions';
import { store } from '~/lib/store/auxStore';
import { compareServerVersion } from '../helpers';
import { decodeFilename } from '../helpers/decodeFilename';
import { sendFileMessage as sendFileMessageV1 } from './sendFileMessage';
import { sendFileMessageV2 } from './sendFileMessageV2';

export const sendFileMessage = (
	rid: string,
	originalFileInfo: TSendFileMessageFileInfo,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<void> => {
	const decodedName = decodeFilename(originalFileInfo.name);
	const fileInfo = decodedName === originalFileInfo.name ? originalFileInfo : { ...originalFileInfo, name: decodedName };
	const { version: serverVersion } = store.getState().server;
	if (compareServerVersion(serverVersion, 'lowerThan', '6.10.0')) {
		return sendFileMessageV1(rid, fileInfo as IUpload, tmid, server, user, isForceTryAgain);
	}

	return sendFileMessageV2(rid, fileInfo, tmid, server, user, isForceTryAgain);
};
