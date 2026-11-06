import { type IShareAttachment } from '~/definitions';

export const hasOnlySkippedAttachments = (attachments: IShareAttachment[]): boolean =>
	attachments.length > 0 && !attachments.some(({ canUpload }) => canUpload);
