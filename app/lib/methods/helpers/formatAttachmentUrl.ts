import * as FileSystem from 'expo-file-system';

export const formatAttachmentUrl = (attachmentUrl: string | undefined, userId: string, token: string, server: string): string => {
	if (attachmentUrl?.startsWith(`${FileSystem.documentDirectory}`)) {
		return attachmentUrl;
	}
	if (attachmentUrl && attachmentUrl.startsWith('http')) {
		if (attachmentUrl.includes('rc_token')) {
			return encodeURI(attachmentUrl);
		}
		return encodeURI(`${attachmentUrl}?rc_uid=${userId}&rc_token=${token}`);
	}
	return encodeURI(`${server}${attachmentUrl}?rc_uid=${userId}&rc_token=${token}`);
};
