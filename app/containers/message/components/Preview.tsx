import Message from '../index';
import { MessageRoomProvider } from '../stores/MessageRoomStore';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { type TAnyMessageModel, type TGetCustomEmoji } from '../../../definitions';

const MessagePreview = ({ message }: { message: TAnyMessageModel }) => {
	'use memo';

	const { user, baseUrl, customEmojis } = useAppSelector(state => ({
		user: getUserSelector(state),
		baseUrl: state.server.server,
		customEmojis: state.customEmojis
	}));

	const getCustomEmoji: TGetCustomEmoji = name => {
		const emoji = customEmojis[name];
		return emoji ?? null;
	};
	return (
		<MessageRoomProvider user={user} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} rid={message.rid}>
			<Message item={message} isPreview />
		</MessageRoomProvider>
	);
};

export default MessagePreview;
