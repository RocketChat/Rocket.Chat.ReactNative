import { IMessage } from '../../../definitions';

const getActionIcon = (screenName: string, message: IMessage) => {
	switch (screenName) {
		case 'Starred':
			return message.starred ? 'star-filled' : 'star';

		case 'Pinned':
			return 'pin';
	}
};

export default getActionIcon;
