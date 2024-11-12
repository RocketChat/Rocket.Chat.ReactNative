import { Services } from '../../../lib/services';
import { Encryption } from '../../../lib/encryption';
import { SubscriptionType } from '../../../definitions';

interface IFetchFiles {
	t: SubscriptionType;
	rid: string;
	offset: number;
}

interface IFetchMessages {
	t: SubscriptionType;
	rid: string;
	screenName: string;
	userId: string;
	offset: number;
}

const fetchFiles = async ({ t, rid, offset }: IFetchFiles) => {
	const result: any = await Services.getFiles(rid, t, offset);
	if (result.success) {
		result.messages = await Encryption.decryptFiles(result.files);
		return result;
	}
};

const fetchMessages = ({ t, rid, screenName, userId, offset }: IFetchMessages) => {
	switch (screenName) {
		case 'Files':
			return fetchFiles({ rid, t, offset });
		case 'Mentions':
			return Services.getMessages(rid, t, { 'mentions._id': { $in: [userId] } }, offset);
		case 'Starred':
			return Services.getMessages(rid, t, { 'starred._id': { $in: [userId] } }, offset);
		case 'Pinned':
			return Services.getMessages(rid, t, { pinned: true }, offset);
	}
};

export default fetchMessages;
