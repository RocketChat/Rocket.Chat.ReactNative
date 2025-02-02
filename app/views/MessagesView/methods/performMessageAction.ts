import { IMessage } from '../../../definitions';
import { Services } from '../../../lib/services';

const performMessageAction = (screenName: string, message: IMessage) => {
	switch (screenName) {
		case 'Pinned':
			return Services.togglePinMessage(message._id, message.pinned);
		case 'Starred':
			return Services.toggleStarMessage(message._id, message.starred);
	}
};

export default performMessageAction;
