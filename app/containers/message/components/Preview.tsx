import Message from '../index';
import { MessageRoomProvider } from '../stores/MessageRoomStore';
import { A11yGateProvider } from '../stores/A11yGate';
import { type TAnyMessageModel } from '../../../definitions';

const MessagePreview = ({ message }: { message: TAnyMessageModel }) => {
	'use memo';

	return (
		<A11yGateProvider>
			<MessageRoomProvider rid={message.rid}>
				<Message item={message} isPreview />
			</MessageRoomProvider>
		</A11yGateProvider>
	);
};

export default MessagePreview;
