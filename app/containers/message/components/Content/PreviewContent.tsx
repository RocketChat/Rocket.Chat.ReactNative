import { MarkdownPreview } from '../../../markdown';
import { getPreviewMessageFromAttachment } from '../../utils';
import { useAttachments, useMessageText } from '../../stores/MessageStore';
import { useAutoTranslate } from '../../stores/MessageRoomStore';
import ContentWrapper from './ContentWrapper';

const PreviewContent = () => {
	'use memo';

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
