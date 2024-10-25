import { IMessage } from '../../../definitions';

const getActionIcon = (screenName: string, message: IMessage) => {
	switch (screenName) {
		case 'Starred':
			return 'star-filled';

		case 'Pinned':
			return 'pin';
	}
};

export default getActionIcon;
