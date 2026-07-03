import Message from '../index';
import { MessageRoomProvider } from '../stores/MessageRoomStore';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useCustomEmoji } from '../../../lib/hooks/useCustomEmoji';
import { getUserSelector } from '../../../selectors/login';
import { type TAnyMessageModel } from '../../../definitions';

const MessagePreview = ({ message }: { message: TAnyMessageModel }) => {
	'use memo';

	const { user, baseUrl } = useAppSelector(state => ({
		user: getUserSelector(state),
		baseUrl: state.server.server
	}));
	const getCustomEmoji = useCustomEmoji();

	return (
		<MessageRoomProvider user={user} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} rid={message.rid}>
			<Message item={message} isPreview />
		</MessageRoomProvider>
	);
};

export default MessagePreview;
