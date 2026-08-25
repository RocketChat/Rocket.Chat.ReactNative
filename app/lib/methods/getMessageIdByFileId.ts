import { Q } from '@nozbe/watermelondb';

import { type IMessage } from '../../definitions';
import database from '../database';
import { sanitizeLikeString } from '../database/utils';
import log from './helpers/log';
import { type RoomTypes, roomTypeToApiType } from './roomTypeToApiType';
import sdk from '../services/sdk';

// `rooms.files` returns upload records: `_id` is the FILE id, with no link back to its message.
const HISTORY_SKEW_MS = 5000;
const HISTORY_COUNT = 5;

const carriesFile = (message: IMessage, fileId: string): boolean =>
	message.file?._id === fileId || !!message.files?.some(file => file._id === fileId);

// `attachments` is raw JSON in a text column embedding `/file-upload/<fileId>/<name>`.
const findLocally = async (rid: string, fileId: string): Promise<string | null> => {
	const likeString = sanitizeLikeString(fileId);
	if (!likeString) {
		return null;
	}
	const messages = await database.active
		.get('messages')
		.query(Q.where('rid', rid), Q.where('attachments', Q.like(`%${likeString}%`)), Q.take(1))
		.fetch();
	return messages.length ? messages[0].id : null;
};

const findOnServer = async (rid: string, t: RoomTypes, fileId: string, uploadedAt: string | Date): Promise<string | null> => {
	const uploadedAtMs = new Date(uploadedAt).getTime();
	if (!Number.isFinite(uploadedAtMs)) {
		return null;
	}
	const params = {
		roomId: rid,
		latest: new Date(uploadedAtMs + HISTORY_SKEW_MS).toISOString(),
		count: HISTORY_COUNT,
		showThreadMessages: true
	};

	// sdk.get is typed per endpoint, so the api type branches rather than interpolates.
	let data;
	switch (roomTypeToApiType(t)) {
		case 'channels':
			data = await sdk.get('channels.history', params);
			break;
		case 'groups':
			data = await sdk.get('groups.history', params);
			break;
		case 'im':
			data = await sdk.get('im.history', params);
			break;
		default:
			return null;
	}

	if (!data?.success) {
		return null;
	}
	return (data.messages as IMessage[])?.find(message => carriesFile(message, fileId))?._id ?? null;
};

// Message id that carries the given upload, or null when it can't be resolved.
export const getMessageIdByFileId = async ({
	rid,
	t,
	fileId,
	uploadedAt
}: {
	rid: string;
	t: RoomTypes;
	fileId: string;
	uploadedAt: string | Date;
}): Promise<string | null> => {
	try {
		return (await findLocally(rid, fileId)) ?? (await findOnServer(rid, t, fileId, uploadedAt));
	} catch (e) {
		log(e);
		return null;
	}
};

export default getMessageIdByFileId;
