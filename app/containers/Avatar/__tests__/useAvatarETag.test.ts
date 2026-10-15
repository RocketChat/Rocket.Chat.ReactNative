import { act, renderHook } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';

import { useAvatarETag } from '../useAvatarETag';

interface IFakeRecord {
	avatarETag: string;
	username?: string;
	changes: BehaviorSubject<IFakeRecord | null>;
	observe: () => BehaviorSubject<IFakeRecord | null>;
}

const createRecord = (avatarETag: string, username?: string): IFakeRecord => {
	const changes = new BehaviorSubject<IFakeRecord | null>(null);
	const record: IFakeRecord = { avatarETag, username, changes, observe: () => changes };
	changes.next(record);
	return record;
};

const changeAvatar = (record: IFakeRecord, avatarETag: string) =>
	act(() => {
		record.avatarETag = avatarETag;
		record.changes.next(record);
	});

const createCollection = (records: IFakeRecord[], idOf: (record: IFakeRecord) => string) => {
	const findById = (id: string) => records.find(candidate => idOf(candidate) === id);
	const collection = {
		table: 'fake',
		_cache: { get: () => undefined, recordFromQueryResult: (record: IFakeRecord) => record },
		database: {
			adapter: {
				underlyingAdapter: {
					find: (_table: string, id: string, callback: (result: object) => void) => callback({ value: findById(id) ?? null })
				}
			}
		},
		query: (clause: { comparison: { right: { value: string } } }) => ({ collection, username: clause.comparison.right.value }),
		_fetchQuery: (query: { username: string }, callback: (result: object) => void) =>
			callback({ value: records.filter(record => record.username === query.username) })
	};
	return collection;
};

const mockRoomA = createRecord('etag-room-a');
const mockRoomB = createRecord('etag-room-b');
const mockUser = createRecord('etag-user', 'john');
const mockLoggedUser = createRecord('etag-me');

const initialETags = new Map([mockRoomA, mockRoomB, mockUser, mockLoggedUser].map(record => [record, record.avatarETag]));

beforeEach(() => {
	initialETags.forEach((avatarETag, record) => {
		record.avatarETag = avatarETag;
	});
});

const mockCollections: Record<string, ReturnType<typeof createCollection>> = {
	subscriptions: createCollection([mockRoomA, mockRoomB], record => (record === mockRoomA ? 'room-a' : 'room-b')),
	users: createCollection([mockUser], () => 'user-id'),
	loggedUsers: createCollection([mockLoggedUser], () => 'me')
};

jest.unmock('../useAvatarETag');

jest.mock('~/lib/database', () => ({
	active: { get: (table: string) => mockCollections[table] },
	servers: { get: () => mockCollections.loggedUsers }
}));

const renderAvatarETag = (initialProps: Parameters<typeof useAvatarETag>[0]) => {
	const renderedETags: (string | undefined)[] = [];
	const hook = renderHook(
		(props: Parameters<typeof useAvatarETag>[0]) => {
			const { avatarETag } = useAvatarETag(props);
			renderedETags.push(avatarETag);
			return avatarETag;
		},
		{ initialProps }
	);
	return { ...hook, renderedETags };
};

const roomProps = (rid: string) => ({ text: rid, type: 'c', rid, id: 'me', username: 'me-username' });

it('returns the room ETag on the first render', () => {
	const { renderedETags } = renderAvatarETag(roomProps('room-a'));

	expect(renderedETags[0]).toBe('etag-room-a');
});

it('returns a direct message user ETag on the first render', () => {
	const { renderedETags } = renderAvatarETag({ text: 'john', type: 'd', id: 'me', username: 'me-username' });

	expect(renderedETags[0]).toBe('etag-user');
});

it('returns the logged user ETag on the first render', () => {
	const { renderedETags } = renderAvatarETag({ text: 'me-username', id: 'me', username: 'me-username' });

	expect(renderedETags[0]).toBe('etag-me');
});

it('returns undefined when no record exists', () => {
	const { result } = renderAvatarETag(roomProps('room-unknown'));

	expect(result.current).toBeUndefined();
});

it('updates when the avatar changes', () => {
	const { result } = renderAvatarETag(roomProps('room-a'));

	changeAvatar(mockRoomA, 'etag-room-a-2');

	expect(result.current).toBe('etag-room-a-2');
});

it('follows the new room when a recycled row switches rooms', () => {
	const { result, rerender, renderedETags } = renderAvatarETag(roomProps('room-a'));
	const rendersBeforeSwitch = renderedETags.length;

	rerender(roomProps('room-b'));

	expect(renderedETags.slice(rendersBeforeSwitch)).not.toContain('etag-room-a');
	expect(result.current).toBe('etag-room-b');

	changeAvatar(mockRoomB, 'etag-room-b-2');
	expect(result.current).toBe('etag-room-b-2');

	changeAvatar(mockRoomA, 'etag-room-a-3');
	expect(result.current).toBe('etag-room-b-2');
});

it('stops observing the previous room after switching', () => {
	const { rerender } = renderAvatarETag(roomProps('room-a'));

	rerender(roomProps('room-b'));

	expect(mockRoomA.changes.observed).toBe(false);
	expect(mockRoomB.changes.observed).toBe(true);
});
