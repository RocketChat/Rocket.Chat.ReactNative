import { shallowEqual } from 'react-redux';

import Message from '../index';
import { MessageRoomProvider } from '../stores/MessageRoomStore';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { type TAnyMessageModel } from '../../../definitions';

const MessagePreview = ({ message }: { message: TAnyMessageModel }) => {
	'use memo';

	const { user, baseUrl } = useAppSelector(
		state => ({
			user: getUserSelector(state),
			baseUrl: state.server.server
		}),
		shallowEqual
	);

	return (
		<MessageRoomProvider user={user} baseUrl={baseUrl} rid={message.rid}>
			<Message item={message} isPreview />
		</MessageRoomProvider>
	);
};

export default MessagePreview;
