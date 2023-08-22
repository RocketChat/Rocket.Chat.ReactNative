import { LOCAL_DOCUMENT_DIRECTORY } from '../handleMediaDownload';

export const formatAttachmentUrl = (attachmentUrl: string | undefined, userId: string, token: string, server: string): string => {
	if (LOCAL_DOCUMENT_DIRECTORY && attachmentUrl?.startsWith(LOCAL_DOCUMENT_DIRECTORY)) {
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
