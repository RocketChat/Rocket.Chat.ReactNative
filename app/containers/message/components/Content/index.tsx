import EncryptedContent from './EncryptedContent';
import IgnoredContent from './IgnoredContent';
import InfoContent from './InfoContent';
import MarkdownContent from './MarkdownContent';
import PreviewContent from './PreviewContent';
import { useIsEncrypted, useIsInfoMessage, useMessageIgnored, useMessageText, useThreadData } from '../../stores/MessageStore';
import { useIsThreadRoom } from '../../stores/MessageRoomStore';

// isInfo forces InfoContent regardless of useIsInfoMessage — jitsi_call_started is deliberately
// excluded there (it isn't a compact/non-touchable info row) but still needs the info-style body.
const Content = ({ isInfo: isInfoProp }: { isInfo?: boolean } = {}) => {
	'use memo';

	const isInfoMessage = useIsInfoMessage();
	const isInfo = isInfoProp ?? isInfoMessage;
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

export default Content;
