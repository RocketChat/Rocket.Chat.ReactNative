import Markdown from '~/containers/markdown';
import { useSetting } from '~/lib/hooks/useSetting';
import { useMarkdownData, useMessageText, useOnLinkPress } from '~/containers/message/stores/MessageStore';
import { useMessageUser, useNavToRoomInfo } from '~/containers/message/stores/MessageRoomStore';
import ContentWrapper from './ContentWrapper';

const MarkdownContent = () => {
	const useRealName = useSetting('UI_Use_Real_Name') as boolean;
	const user = useMessageUser();
	const onLinkPress = useOnLinkPress();
	const navToRoomInfo = useNavToRoomInfo();
	const { mentions, channels } = useMarkdownData();
	const { messageText } = useMessageText();

	return (
		<ContentWrapper>
			<Markdown
				msg={messageText}
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
