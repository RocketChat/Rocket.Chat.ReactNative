import Markdown from '../../../markdown';
import { useSetting } from '../../../../lib/hooks/useSetting';
import { useMarkdownData, useMessageText, useOnLinkPress } from '../../stores/MessageStore';
import { useMessageUser, useNavToRoomInfoOverride } from '../../stores/MessageRoomStore';
import { useRoomMessageHandlers } from '../../hooks/useRoomMessageHandlers';
import ContentWrapper from './ContentWrapper';

const MarkdownContent = () => {
	'use memo';

	const useRealName = useSetting('UI_Use_Real_Name') as boolean;
	const user = useMessageUser();
	const onLinkPress = useOnLinkPress();
	const navToRoomInfoOverride = useNavToRoomInfoOverride();
	const { navToRoomInfo: selfSourcedNavToRoomInfo } = useRoomMessageHandlers({ optional: true }) ?? {};
	const navToRoomInfo = navToRoomInfoOverride ?? selfSourcedNavToRoomInfo;
	const { md, mentions, channels, t: type } = useMarkdownData();
	const { messageText, isTranslated } = useMessageText();

	return (
		<ContentWrapper>
			<Markdown
				msg={messageText}
				md={type !== 'e2e' ? md : undefined}
				username={user?.username ?? ''}
				channels={channels}
				mentions={mentions}
				navToRoomInfo={navToRoomInfo}
				useRealName={useRealName}
				onLinkPress={onLinkPress}
				isTranslated={isTranslated}
			/>
		</ContentWrapper>
	);
};

export default MarkdownContent;
