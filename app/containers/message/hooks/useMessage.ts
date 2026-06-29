import { useRef, useSyncExternalStore } from 'react';
import { type Root } from '@rocket.chat/message-parser';

import {
	type IAttachment,
	type IEditedBy,
	type IMessage,
	type IMessageTranslations,
	type IReaction,
	type IUrl,
	type IUserChannel,
	type IUserMention,
	type IUserMessage,
	type TAnyMessageModel
} from 'definitions';

export type IMessageSnapshot = Pick<
	IMessage,
	| 'id'
	| 'msg'
	| 't'
	| 'ts'
	| 'alias'
	| 'groupable'
	| 'avatar'
	| 'emoji'
	| 'status'
	| 'pinned'
	| 'role'
	| 'drid'
	| 'dcount'
	| 'dlm'
	| 'tmid'
	| 'tcount'
	| 'tlm'
	| 'unread'
	| 'autoTranslate'
	| 'tmsg'
	| 'blocks'
	| 'e2e'
	| 'comment'
> & {
	u: IUserMessage | undefined;
	attachments: IAttachment[] | undefined;
	urls: IUrl[] | undefined;
	editedBy: IEditedBy | undefined;
	reactions: IReaction[] | undefined;
	replies: string[] | undefined;
	mentions: IUserMention[] | undefined;
	channels: IUserChannel[] | undefined;
	translations: IMessageTranslations[] | undefined;
	md: Root | undefined;
};

const readSnapshot = (item: TAnyMessageModel): IMessageSnapshot => ({
	id: item.id,
	msg: item.msg,
	t: item.t,
	ts: item.ts,
	u: item.u,
	alias: item.alias,
	groupable: item.groupable,
	avatar: item.avatar,
	emoji: item.emoji,
	attachments: item.attachments,
	urls: item.urls,
	status: item.status,
	pinned: item.pinned,
	editedBy: item.editedBy,
	reactions: item.reactions,
	role: item.role,
	drid: item.drid,
	dcount: item.dcount,
	dlm: item.dlm,
	tmid: item.tmid,
	tcount: item.tcount,
	tlm: item.tlm,
	replies: item.replies,
	mentions: item.mentions,
	channels: item.channels,
	unread: item.unread,
	autoTranslate: item.autoTranslate,
	translations: item.translations,
	tmsg: item.tmsg,
	blocks: item.blocks,
	e2e: item.e2e,
	md: item.md,
	comment: item.comment
});

export const useMessage = (item: TAnyMessageModel): IMessageSnapshot => {
	'use memo';

	// prevItemRef lets us detect item identity changes so getSnapshot always
	// reflects the CURRENT item synchronously — even before the new subscription
	// fires its first callback.
	const prevItemRef = useRef<TAnyMessageModel | null>(null);

	// Cache the latest snapshot so getSnapshot is referentially stable between
	// emissions; useSyncExternalStore requires it to return the same object when
	// nothing has changed, otherwise React will infinite-loop.
	const snapshotRef = useRef<IMessageSnapshot | null>(null);

	if (prevItemRef.current !== item) {
		prevItemRef.current = item;
		snapshotRef.current = readSnapshot(item);
	}

	const subscribe = (onStoreChange: () => void): (() => void) => {
		// @ts-ignore: experimentalSubscribe is not yet in WatermelonDB's TS types
		const unsubscribe = item.experimentalSubscribe(() => {
			snapshotRef.current = readSnapshot(item);
			onStoreChange();
		});
		return unsubscribe;
	};

	const getSnapshot = (): IMessageSnapshot => snapshotRef.current as IMessageSnapshot;

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
