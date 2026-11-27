import Markdown from '~/containers/markdown';
import { useSetting } from '~/lib/hooks/useSetting';
import { useMarkdownData, useMessageText, useOnLinkPress } from '~/containers/message/stores/MessageStore';
import { useMessageUser, useNavToRoomInfo } from '~/containers/message/stores/MessageRoomStore';
import { E2E_MESSAGE_TYPE } from '~/lib/constants/keys';
import ContentWrapper from './ContentWrapper';

const MarkdownContent = () => {
	const useRealName = useSetting('UI_Use_Real_Name') as boolean;
	const user = useMessageUser();
	const onLinkPress = useOnLinkPress();
	const navToRoomInfo = useNavToRoomInfo();
	const { md, mentions, channels, t: type } = useMarkdownData();
	const { messageText, isTranslated } = useMessageText();
	const serverRoot = type === E2E_MESSAGE_TYPE || isTranslated ? undefined : md;

	return (
		<ContentWrapper>
			<Markdown
				msg={messageText}
				md={serverRoot}
				username={user?.username ?? ''}
				channels={channels}
				mentions={mentions}
				navToRoomInfo={navToRoomInfo}
				useRealName={useRealName}
				onLinkPress={onLinkPress}
			/>
		</ContentWrapper>
	);
};

export default MarkdownContent;
