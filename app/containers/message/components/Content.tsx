import EncryptedContent from './Content/EncryptedContent';
import IgnoredContent from './Content/IgnoredContent';
import InfoContent from './Content/InfoContent';
import MarkdownContent from './Content/MarkdownContent';
import PreviewContent from './Content/PreviewContent';
import { useIsEncrypted, useIsInfo, useMessageIgnored, useMessageText, useThreadData } from '../stores/MessageStore';
import { useIsThreadRoom } from '../stores/MessageRoomStore';

const Content = () => {
	'use memo';

	const isInfo = useIsInfo();
	const isIgnored = useMessageIgnored();
	const isEncrypted = useIsEncrypted();
	const { tmid } = useThreadData();
	const isThreadRoom = useIsThreadRoom();
	const { messageText } = useMessageText();

	if (isInfo) {
		return <InfoContent />;
	}

	if (isIgnored) {
		return <IgnoredContent />;
	}

	if (isEncrypted) {
		return <EncryptedContent />;
	}

	if (tmid && !isThreadRoom) {
		return <PreviewContent />;
	}

	if (messageText) {
		return <MarkdownContent />;
	}

	return null;
};

Content.displayName = 'MessageContent';

export default Content;
