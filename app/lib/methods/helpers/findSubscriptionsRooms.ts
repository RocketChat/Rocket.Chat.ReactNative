import { Q } from '@nozbe/watermelondb';

import { type IServerSubscription, type IServerRoom } from '../../../definitions';
import database from '../../database';

export default async function findSubscriptionsRooms(subscriptions: IServerSubscription[], rooms: IServerRoom[]) {
	let sub = subscriptions;
	try {
		const db = database.active;
		const subCollection = db.get('subscriptions');

		const roomIds = rooms.filter(r => !subscriptions.find(s => s.rid === r._id)).map(r => r._id);
		const existingSubs = await subCollection.query(Q.where('rid', Q.oneOf(roomIds))).fetch();
		const mappedExistingSubs = existingSubs.map(s => ({
			_id: s._id,
			f: s.f,
			t: s.t,
			ts: s.ts,
			ls: s.ls,
			name: s.name,
			fname: s.fname,
			rid: s.rid,
			open: s.open,
			alert: s.alert,
			unread: s.unread,
			userMentions: s.userMentions,
			roomUpdatedAt: s.roomUpdatedAt,
			ro: s.ro,
			lastOpen: s.lastOpen,
			description: s.description,
			announcement: s.announcement,
			bannerClosed: s.bannerClosed,
			topic: s.topic,
			blocked: s.blocked,
			blocker: s.blocker,
			reactWhenReadOnly: s.reactWhenReadOnly,
			archived: s.archived,
			joinCodeRequired: s.joinCodeRequired,
			muted: s.muted,
			unmuted: s.unmuted,
			broadcast: s.broadcast,
			prid: s.prid,
			draftMessage: s.draftMessage,
			lastThreadSync: s.lastThreadSync,
			jitsiTimeout: s.jitsiTimeout,
			autoTranslate: s.autoTranslate,
			autoTranslateLanguage: s.autoTranslateLanguage,
			lastMessage: s.lastMessage,
			usernames: s.usernames,
			uids: s.uids,
			visitor: s.visitor,
			departmentId: s.departmentId,
			servedBy: s.servedBy,
			livechatData: s.livechatData,
			tags: s.tags,
			encrypted: s.encrypted,
			e2eKeyId: s.e2eKeyId,
			E2EKey: s.E2EKey,
			avatarETag: s.avatarETag,
			roles: s.roles
		}));
		// Assign
		sub = subscriptions.concat(mappedExistingSubs as unknown as IServerSubscription);
	} catch {
		// do nothing
	}

	return sub;
}
