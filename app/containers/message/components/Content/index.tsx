import EncryptedContent from './EncryptedContent';
import IgnoredContent from './IgnoredContent';
import InfoContent from './InfoContent';
import MarkdownContent from './MarkdownContent';
import PreviewContent from './PreviewContent';
import { useContentVariant } from './useContentVariant';

// isInfo forces InfoContent regardless of useIsInfoMessage — jitsi_call_started is deliberately
// excluded there (it isn't a compact/non-touchable info row) but still needs the info-style body.
const Content = ({ isInfo }: { isInfo?: boolean } = {}) => {
	const variant = useContentVariant(isInfo);

	switch (variant) {
		case 'info':
			return <InfoContent />;
		case 'ignored':
			return <IgnoredContent />;
		case 'encrypted':
			return <EncryptedContent />;
		case 'preview':
			return <PreviewContent />;
		case 'markdown':
			return <MarkdownContent />;
		default:
			return null;
	}
};

export default Content;
