import { type IMessage } from '../../../definitions';
import { togglePinMessage, toggleStarMessage } from '../../../lib/services/restApi';

const performMessageAction = (screenName: string, message: IMessage) => {
	switch (screenName) {
		case 'Pinned':
			return togglePinMessage(message._id, message.pinned);
		case 'Starred':
			return toggleStarMessage(message._id, message.starred);
	}
};

export default performMessageAction;
