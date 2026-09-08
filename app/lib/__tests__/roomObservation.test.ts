import { type TSubscriptionModel } from '../../definitions/ISubscription';
import { type TRoomOrPreview } from '../../definitions/TRoom';
import {
	createRoomSnapshot,
	getRoom,
	getRoomObservationPatch,
	getRoomObservedFieldValues,
	roomObservedColumnByField,
	roomObservedColumns,
	roomObservedFields,
	type IRoomObservation
} from '../roomObservation';

const buildRoom = (room: Partial<TSubscriptionModel> = {}): TSubscriptionModel =>
	({ rid: 'rid', t: 'c', name: 'general', ...room }) as TSubscriptionModel;

const buildObservation = (room: TRoomOrPreview, observation: Partial<IRoomObservation> = {}): IRoomObservation => ({
	fields: getRoomObservedFieldValues(room),
	snapshot: createRoomSnapshot(room),
	subscribed: true,
	joined: true,
	lastMessageFromAgent: false,
	...observation
});

describe('observed columns', () => {
	it('equals the record values plus last_message', () => {
		expect(roomObservedColumns).toEqual([...Object.values(roomObservedColumnByField), 'last_message']);
	});

	it('derives the field list from the record keys', () => {
		expect(roomObservedFields).toEqual(Object.keys(roomObservedColumnByField));
	});
});

describe('snapshot', () => {
	it('unwraps the room it was built with', () => {
		const room = buildRoom();
		expect(getRoom(createRoomSnapshot(room))).toBe(room);
	});

	it('does not expose the room as a plain property', () => {
		expect(Object.keys(createRoomSnapshot(buildRoom()))).toEqual([]);
	});
});

describe('getRoomObservationPatch', () => {
	it('returns a patch when a tracked field is mutated on the same instance', () => {
		const room = buildRoom({ name: 'general' });
		const previous = buildObservation(room);
		room.name = 'renamed';

		const patch = getRoomObservationPatch(previous, room);

		expect(patch).not.toBeNull();
		expect(patch?.snapshot).not.toBe(previous.snapshot);
		expect(patch?.fields?.name).toBe('renamed');
	});

	it('returns null when only untracked fields are mutated on the same instance', () => {
		const room = buildRoom({ description: 'before' } as Partial<TSubscriptionModel>);
		const previous = buildObservation(room);
		(room as { description?: string }).description = 'after';

		expect(getRoomObservationPatch(previous, room)).toBeNull();
	});

	it('returns a patch for a different record with equal fields', () => {
		const previous = buildObservation(buildRoom());

		const patch = getRoomObservationPatch(previous, buildRoom());

		expect(patch?.snapshot).not.toBe(previous.snapshot);
	});

	it.each([
		['roles', ['owner']],
		['tunread', ['id']],
		['tunreadUser', ['id']],
		['tunreadGroup', ['id']],
		['muted', ['user']],
		['unmuted', ['user']],
		['ignored', ['user']],
		['sysMes', ['uj']]
	])('returns null when %s carries an identical payload in a new array', (field, value) => {
		const room = buildRoom({ [field]: [...value] } as Partial<TSubscriptionModel>);
		const previous = buildObservation(room);
		(room as unknown as Record<string, unknown>)[field] = [...value];

		expect(getRoomObservationPatch(previous, room)).toBeNull();
	});

	it.each([
		['roles', ['owner'], ['owner', 'moderator']],
		['ignored', ['user'], []]
	])('returns a patch when %s content differs', (field, before, after) => {
		const room = buildRoom({ [field]: before } as Partial<TSubscriptionModel>);
		const previous = buildObservation(room);
		(room as unknown as Record<string, unknown>)[field] = after;

		const patch = getRoomObservationPatch(previous, room);

		expect(patch?.fields?.[field as 'roles']).toEqual(after);
	});

	describe('empty row', () => {
		it('unsubscribes and unjoins a non Direct Message room', () => {
			const previous = buildObservation(buildRoom({ t: 'c' } as Partial<TSubscriptionModel>));

			expect(getRoomObservationPatch(previous, undefined)).toEqual({ subscribed: false, joined: false });
		});

		it('preserves joined for a Direct Message', () => {
			const previous = buildObservation(buildRoom({ t: 'd' } as Partial<TSubscriptionModel>));

			expect(getRoomObservationPatch(previous, undefined)).toEqual({ subscribed: false });
		});

		it('keeps the current snapshot', () => {
			const previous = buildObservation(buildRoom());

			expect(getRoomObservationPatch(previous, undefined)).not.toHaveProperty('snapshot');
		});
	});

	describe('lastMessageFromAgent', () => {
		const omnichannelRoom = (lastMessage: TSubscriptionModel['lastMessage']) =>
			buildRoom({ t: 'l', lastMessage } as Partial<TSubscriptionModel>);

		it('keeps snapshot identity when only the flag changes', () => {
			const room = omnichannelRoom({ u: { _id: 'agent' } } as TSubscriptionModel['lastMessage']);
			const previous = buildObservation(room);

			const patch = getRoomObservationPatch(previous, room);

			expect(patch).toEqual({ subscribed: true, joined: true, lastMessageFromAgent: true });
		});

		it('returns null when a lastMessage change leaves the flag unchanged', () => {
			const room = omnichannelRoom({ u: { _id: 'agent' }, msg: 'before' } as TSubscriptionModel['lastMessage']);
			const previous = buildObservation(room, { lastMessageFromAgent: true });
			room.lastMessage = { u: { _id: 'agent' }, msg: 'after' } as TSubscriptionModel['lastMessage'];

			expect(getRoomObservationPatch(previous, room)).toBeNull();
		});

		it.each([
			['a visitor message', { u: { _id: 'visitor' }, token: 'token' }, false],
			['no last message', undefined, false],
			['an agent message', { u: { _id: 'agent' } }, true]
		])('derives %s', (_case, lastMessage, expected) => {
			const room = omnichannelRoom(lastMessage as TSubscriptionModel['lastMessage']);
			const previous = buildObservation(room);

			expect(getRoomObservationPatch(previous, room)?.lastMessageFromAgent ?? false).toBe(expected);
		});

		it('is false outside Omnichannel rooms', () => {
			const room = buildRoom({ t: 'c', lastMessage: { u: { _id: 'agent' } } } as Partial<TSubscriptionModel>);
			const previous = buildObservation(room, { lastMessageFromAgent: true });

			expect(getRoomObservationPatch(previous, room)?.lastMessageFromAgent).toBe(false);
		});
	});

	it('resubscribes an unsubscribed room without a record change', () => {
		const room = buildRoom();
		const previous = buildObservation(room, { subscribed: false, joined: false });

		expect(getRoomObservationPatch(previous, room)).toEqual({ subscribed: true, joined: true, lastMessageFromAgent: false });
	});
});
