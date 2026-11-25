import { MarkdownPreview } from '~/containers/markdown';
import ContentWrapper from './ContentWrapper';
import { usePreviewMessage } from './useContentVariant';

const PreviewContent = () => {
	const previewMsg = usePreviewMessage();

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
