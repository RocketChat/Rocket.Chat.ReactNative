import { MarkdownPreview } from '~/containers/markdown';
import { getPreviewMessageFromAttachment } from '~/containers/message/utils';
import { useAttachments, useMessageText } from '~/containers/message/stores/MessageStore';
import { useAutoTranslate } from '~/containers/message/stores/MessageRoomStore';
import ContentWrapper from './ContentWrapper';

const PreviewContent = () => {
	const { messageText } = useMessageText();
	const attachments = useAttachments();
	const { autoTranslateLanguage } = useAutoTranslate();

	const previewMsg =
		messageText || (attachments?.length ? getPreviewMessageFromAttachment(attachments[0], autoTranslateLanguage) : undefined);

	if (!previewMsg) {
		return null;
	}

	return (
		<ContentWrapper>
			<MarkdownPreview testID={`message-preview-${previewMsg}`} msg={previewMsg} />
		</ContentWrapper>
	);
};

export default PreviewContent;
