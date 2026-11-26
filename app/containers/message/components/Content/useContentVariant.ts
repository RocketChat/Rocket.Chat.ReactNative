import { getPreviewMessageFromAttachment } from '~/containers/message/utils';
import {
	useAttachments,
	useIsEncrypted,
	useIsInfoMessage,
	useMessageIgnored,
	useMessageText,
	useThreadData
} from '~/containers/message/stores/MessageStore';
import { useAutoTranslate, useIsThreadRoom } from '~/containers/message/stores/MessageRoomStore';

export type TContentVariant = 'info' | 'ignored' | 'encrypted' | 'preview' | 'markdown' | null;

export const usePreviewMessage = (): string | undefined => {
	const { messageText } = useMessageText();
	const attachments = useAttachments();
	const { autoTranslateLanguage } = useAutoTranslate();

	return (
		messageText || (attachments?.length ? getPreviewMessageFromAttachment(attachments[0], autoTranslateLanguage) : undefined)
	);
};

export const useContentVariant = (isInfoProp?: boolean): TContentVariant => {
	const isInfoMessage = useIsInfoMessage();
	const isIgnored = useMessageIgnored();
	const isEncrypted = useIsEncrypted();
	const { tmid } = useThreadData();
	const isThreadRoom = useIsThreadRoom();
	const { messageText } = useMessageText();
	const previewMessage = usePreviewMessage();

	if (isInfoProp ?? isInfoMessage) {
		return 'info';
	}
	if (isIgnored) {
		return 'ignored';
	}
	if (isEncrypted) {
		return 'encrypted';
	}
	if (tmid && !isThreadRoom) {
		return previewMessage ? 'preview' : null;
	}
	if (messageText) {
		return 'markdown';
	}
	return null;
};
