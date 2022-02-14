import { Q } from '@nozbe/watermelondb';

import log from '../../../utils/log';
import { IRoom, ISubscription, TSubscriptionModel } from '../../../definitions';
import database from '../../database';

export default async (
	subscriptions: ISubscription[] = [],
	rooms: IRoom[] = []
): Promise<{ subscriptions: ISubscription[]; rooms: IRoom[] }> => {
	try {
		const db = database.active;
		const subCollection = db.get('subscriptions');

		const roomIds = rooms.filter(r => !subscriptions.find(s => s.rid === r._id)).map(r => r._id) as string[];
		const existingSubsQuery = await subCollection.query(Q.where('rid', Q.oneOf(roomIds))).fetch();
		const existingSubs = existingSubsQuery.map(s => ({
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
			avatarETag: s.avatarETag
		})) as TSubscriptionModel[];
		subscriptions = subscriptions.concat(existingSubs);

		const subsIds = subscriptions.filter(s => !rooms.find(r => s.rid === r._id)).map(s => s._id);
		[];
		const existingRoomsQuery = (await subCollection.query(Q.where('id', Q.oneOf(subsIds))).fetch()) as (TSubscriptionModel & {
			_updatedAt: any;
			v: any;
		})[];
		const existingRooms = existingRoomsQuery.map(r => ({
			_updatedAt: r._updatedAt,
			lastMessage: r.lastMessage,
			description: r.description,
			topic: r.topic,
			announcement: r.announcement,
			reactWhenReadOnly: r.reactWhenReadOnly,
			archived: r.archived,
			joinCodeRequired: r.joinCodeRequired,
			jitsiTimeout: r.jitsiTimeout,
			usernames: r.usernames,
			uids: r.uids,
			ro: r.ro,
			broadcast: r.broadcast,
			muted: r.muted,
			sysMes: r.sysMes,
			v: r.v,
			departmentId: r.departmentId,
			servedBy: r.servedBy,
			livechatData: r.livechatData,
			tags: r.tags,
			encrypted: r.encrypted,
			e2eKeyId: r.e2eKeyId,
			avatarETag: r.avatarETag
		})) as Partial<IRoom>[];

		rooms = rooms.concat(existingRooms as IRoom[]);
	} catch (e) {
		log(e);
	}

	return {
		subscriptions,
		rooms
	};
};
