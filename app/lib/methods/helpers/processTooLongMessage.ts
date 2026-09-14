import * as FileSystem from 'expo-file-system/legacy';

import { type IUser, type TSendFileMessageFileInfo } from '~/definitions';
import { sendFileMessage } from '../sendFileMessage';

export const isTooLongMessage = (text: string, maxAllowedSize?: number): boolean => {
	if (!maxAllowedSize || maxAllowedSize <= 0) {
		return false;
	}
	return text.length > maxAllowedSize;
};

export const canConvertLongMessageToFile = ({
	isEditing,
	fileUploadEnabled,
	allowConvert
}: {
	isEditing: boolean;
	fileUploadEnabled?: boolean;
	allowConvert?: boolean;
}): boolean => !isEditing && !!fileUploadEnabled && !!allowConvert;

export const sendLongMessageAsFile = async ({
	rid,
	tmid,
	server,
	user,
	username,
	text
}: {
	rid: string;
	tmid: string | undefined;
	server: string;
	user: Partial<Pick<IUser, 'id' | 'token'>>;
	username?: string;
	text: string;
}): Promise<void> => {
	if (!FileSystem.cacheDirectory) {
		throw new Error('No cache dir');
	}
	// ponytail: colons replaced, some filesystems reject them in names
	const fileName = `${username || 'anonymous'} - ${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
	const path = `${FileSystem.cacheDirectory}${fileName}`;
	try {
		await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });
		const info = await FileSystem.getInfoAsync(path);
		const size = info.exists && 'size' in info && typeof info.size === 'number' ? info.size : text.length;
		const fileInfo: TSendFileMessageFileInfo = {
			rid,
			path,
			name: fileName,
			size,
			type: 'text/plain'
		};
		await sendFileMessage(rid, fileInfo, tmid, server, user);
	} finally {
		await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
	}
};
