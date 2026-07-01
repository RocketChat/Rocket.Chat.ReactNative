import Message from './index';
import { MessageRoomProvider } from './MessageRoomStore';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../selectors/login';
import { type TAnyMessageModel, type TGetCustomEmoji } from '../../definitions';

const MessagePreview = ({ message }: { message: TAnyMessageModel }) => {
	'use memo';

	const { user, baseUrl, Message_TimeFormat, customEmojis, useRealName } = useAppSelector(state => ({
		user: getUserSelector(state),
		baseUrl: state.server.server,
		Message_TimeFormat: state.settings.Message_TimeFormat as string,
		customEmojis: state.customEmojis,
		useRealName: state.settings.UI_Use_Real_Name as boolean
	}));

	const getCustomEmoji: TGetCustomEmoji = name => {
		const emoji = customEmojis[name];
		return emoji ?? null;
	};
	return (
		<MessageRoomProvider user={user} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} rid={message.rid}>
			<Message item={message} rid={message.rid} timeFormat={Message_TimeFormat} useRealName={useRealName} isPreview />
		</MessageRoomProvider>
	);
};

export default MessagePreview;
