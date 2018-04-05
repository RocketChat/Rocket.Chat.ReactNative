import normalizeMessage from './normalizeMessage';
import messagesStatus from '../../../constants/messagesStatus';
import RocketChat from '../../rocketchat';

export default (message) => {
	message.status = messagesStatus.SENT;
	normalizeMessage(message);
	message.urls = message.urls ? RocketChat._parseUrls(message.urls) : [];
	message._updatedAt = new Date();
	// loadHistory returns message.starred as object
	// stream-room-messages returns message.starred as an array
	message.starred = message.starred && (Array.isArray(message.starred) ? message.starred.length > 0 : !!message.starred);
	return message;
};
