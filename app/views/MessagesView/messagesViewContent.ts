import { type TIconsName } from '../../containers/CustomIcon';
import { type IMessage, type SubscriptionType } from '../../definitions';
import { Encryption } from '../../lib/encryption';
import { getFiles, getMessages, togglePinMessage, toggleStarMessage } from '../../lib/services/restApi';

export type TMessagesViewScreen = 'Files' | 'Mentions' | 'Starred' | 'Pinned';

interface IFetchParams {
	rid: string;
	t: SubscriptionType;
	userId: string;
	offset: number;
}

interface IMessageAction {
	titleI18n: string;
	icon: TIconsName;
	press: (message: IMessage) => Promise<any>;
}

interface IMessagesViewContent {
	testID: string;
	emptyMessageI18n: string;
	fetch: (params: IFetchParams) => Promise<any>;
	action?: IMessageAction;
}

const fetchFiles = async ({ rid, t, offset }: IFetchParams) => {
	const result: any = await getFiles(rid, t, offset);
	if (result.success) {
		result.messages = await Encryption.decryptFiles(result.files);
		return result;
	}
};

export const messagesViewContent: Record<TMessagesViewScreen, IMessagesViewContent> = {
	Files: {
		testID: 'room-files-view',
		emptyMessageI18n: 'No_files',
		fetch: fetchFiles
	},
	Mentions: {
		testID: 'mentioned-messages-view',
		emptyMessageI18n: 'No_mentioned_messages',
		fetch: ({ rid, t, userId, offset }) => getMessages({ roomId: rid, type: t, offset, mentionIds: [userId] })
	},
	Starred: {
		testID: 'starred-messages-view',
		emptyMessageI18n: 'No_starred_messages',
		fetch: ({ rid, t, userId, offset }) => getMessages({ roomId: rid, type: t, offset, starredIds: [userId] }),
		action: {
			titleI18n: 'Unstar',
			icon: 'star-filled',
			press: message => toggleStarMessage(message._id, message.starred)
		}
	},
	Pinned: {
		testID: 'pinned-messages-view',
		emptyMessageI18n: 'No_pinned_messages',
		fetch: ({ rid, t, offset }) => getMessages({ roomId: rid, type: t, offset, pinned: true }),
		action: {
			titleI18n: 'Unpin',
			icon: 'pin',
			press: message => togglePinMessage(message._id, message.pinned)
		}
	}
};
