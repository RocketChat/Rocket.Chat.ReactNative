import { ISubscription } from '../../definitions';

interface IRoomFederated extends ISubscription {
	federated: true;
}

export const isRoomFederated = (room: ISubscription): room is IRoomFederated =>
	'federated' in room && (room as any).federated === true;
