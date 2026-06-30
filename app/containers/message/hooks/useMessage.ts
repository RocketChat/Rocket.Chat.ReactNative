import { useCallback, useRef, useSyncExternalStore } from 'react';
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

type SnapshotCache = { item: TAnyMessageModel; snapshot: IMessageSnapshot };

export const useMessage = (item: TAnyMessageModel): IMessageSnapshot => {
	'use memo';

	// Cache the latest snapshot so getSnapshot returns the same object reference
	// when nothing has changed — useSyncExternalStore requires this to avoid loops.
	const cacheRef = useRef<SnapshotCache | null>(null);

	// getSnapshot and subscribe both close over item directly and are recreated
	// when item identity changes (useCallback with [item] dep). This lets
	// useSyncExternalStore resubscribe on item change without any render-body
	// ref writes.

	const getSnapshot = useCallback((): IMessageSnapshot => {
		if (!cacheRef.current || cacheRef.current.item !== item) {
			cacheRef.current = { item, snapshot: readSnapshot(item) };
		}
		return cacheRef.current.snapshot;
	}, [item]);

	const subscribe = useCallback(
		(onStoreChange: () => void): (() => void) => {
			// @ts-ignore: experimentalSubscribe is not yet in WatermelonDB's TS types
			if (typeof item.experimentalSubscribe !== 'function') {
				return () => {};
			}
			// @ts-ignore
			const unsubscribe = item.experimentalSubscribe(() => {
				cacheRef.current = { item, snapshot: readSnapshot(item) };
				onStoreChange();
			});
			return unsubscribe;
		},
		[item]
	);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
