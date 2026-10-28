import { type TIconsName } from '~/containers/CustomIcon';
import { type IMessage, type IMessageFromServer, type IServerAttachment, type SubscriptionType } from '~/definitions';
import { Encryption } from '~/lib/encryption';
import { getFiles, getMessages, getPinnedMessages, togglePinMessage, toggleStarMessage } from '~/lib/services/restApi';
import getFileUrlAndTypeFromMessage from './methods/getFileUrlAndTypeFromMessage';

export type TMessagesViewScreen = 'Files' | 'Mentions' | 'Starred' | 'Pinned';

interface IFetchParams {
	rid: string;
	t: SubscriptionType;
	userId: string;
	offset: number;
}

export interface IMessagesPage {
	success: boolean;
	messages: IMessageFromServer[];
	total: number;
}

export interface IMessageAction {
	titleI18n: string;
	icon: TIconsName;
	press: (message: IMessage) => Promise<{ success: boolean }>;
}

interface IMessagesViewContent {
	testID: string;
	emptyMessageI18n: string;
	fetch: (params: IFetchParams) => Promise<IMessagesPage>;
	action?: IMessageAction;
}

const toPage = (request: Promise<unknown>) => request as Promise<IMessagesPage>;

const fileToMessage = (file: IServerAttachment) =>
	({
		...file,
		u: file.user,
		ts: file.uploadedAt,
		attachments: [{ title: file.name, ...file, ...getFileUrlAndTypeFromMessage(file) }]
	}) as unknown as IMessageFromServer;

const fetchFiles = async ({ rid, t, offset }: IFetchParams): Promise<IMessagesPage> => {
	const result = await getFiles(rid, t, offset);
	if (!result.success) {
		return { success: false, messages: [], total: 0 };
	}
	const files = await Encryption.decryptFiles(result.files);
	return { success: true, messages: files.map(fileToMessage), total: result.total };
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
		fetch: ({ rid, t, userId, offset }) => toPage(getMessages({ roomId: rid, type: t, offset, mentionIds: [userId] }))
	},
	Starred: {
		testID: 'starred-messages-view',
		emptyMessageI18n: 'No_starred_messages',
		fetch: ({ rid, t, userId, offset }) => toPage(getMessages({ roomId: rid, type: t, offset, starredIds: [userId] })),
		action: {
			titleI18n: 'Unstar',
			icon: 'star-filled',
			press: message => toggleStarMessage(message._id, message.starred)
		}
	},
	Pinned: {
		testID: 'pinned-messages-view',
		emptyMessageI18n: 'No_pinned_messages',
		fetch: ({ rid, offset }) => toPage(getPinnedMessages({ roomId: rid, offset, count: 50 })),
		action: {
			titleI18n: 'Unpin',
			icon: 'pin',
			press: message => togglePinMessage(message._id, message.pinned)
		}
	}
};
