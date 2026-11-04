import { useShallow } from 'zustand/react/shallow';
import { useStore } from 'zustand';

import { getRoomTitle, isGroupChat } from '~/lib/methods/helpers';
import { isInviteSubscription } from '~/lib/methods/isInviteSubscription';
import { type IOmnichannelSource, type ISubscription, type IVisitor } from '~/definitions';
import { type RoomStore } from '../definitions';
import { fromSubscription } from '../stores/RoomStoreContext';

export interface IHeaderFields {
	prid?: string;
	title: string;
	parentTitle: string;
	teamMain: boolean;
	subtitle?: string;
	type: string;
	visitor?: IVisitor;
	isGroupChat: boolean;
	sourceType?: IOmnichannelSource;
	abacAttributes: ISubscription['abacAttributes'];
	disabled: boolean;
}

export const useHeaderFields = (roomStore: RoomStore, tmid?: string, threadName?: string): IHeaderFields =>
	useStore(
		roomStore,
		useShallow((s): IHeaderFields => {
			const room = s.room;
			const title = tmid ? (threadName ?? '') : getRoomTitle(room);
			const parentTitle = tmid ? getRoomTitle(room) : '';

			return {
				prid: room?.prid,
				title,
				teamMain: fromSubscription(r => !!r.teamMain, false)(s),
				parentTitle,
				subtitle: fromSubscription(r => r.topic, undefined)(s),
				type: room?.t,
				visitor: fromSubscription(r => r.visitor, undefined)(s),
				isGroupChat: fromSubscription(r => isGroupChat(r), false)(s),
				sourceType: fromSubscription(r => r.source, undefined)(s),
				abacAttributes: fromSubscription(r => r.abacAttributes, undefined)(s),
				disabled: fromSubscription(r => isInviteSubscription(r), false)(s)
			};
		})
	);
