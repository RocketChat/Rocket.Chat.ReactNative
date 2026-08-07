import { MarkdownPreview } from '../../../markdown';
import { getPreviewMessageFromAttachment } from '../../utils';
import { useAttachments, useMarkdownData, useMessageText } from '../../stores/MessageStore';
import { useAutoTranslate } from '../../stores/MessageRoomStore';
import ContentWrapper from './ContentWrapper';

const PreviewContent = () => {
	const { messageText } = useMessageText();
	const attachments = useAttachments();
	const { channels } = useMarkdownData();
	const { autoTranslateLanguage } = useAutoTranslate();

	const previewMsg =
		messageText || (attachments?.length ? getPreviewMessageFromAttachment(attachments[0], autoTranslateLanguage) : undefined);

	if (!previewMsg) {
		return null;
	}

	return (
		<ContentWrapper>
			<MarkdownPreview testID={`message-preview-${previewMsg}`} msg={previewMsg} channels={channels} />
		</ContentWrapper>
	);
};

export default PreviewContent;
