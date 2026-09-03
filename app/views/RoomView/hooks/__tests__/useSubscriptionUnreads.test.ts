import { act, renderHook } from '@testing-library/react-native';

import database from '../../../../lib/database';
import { getUidDirectMessage } from '../../../../lib/methods/helpers/helpers';
import { createRoomStore, observeRoom } from '../../stores/RoomStore';
import { useSubscriptionUnreads } from '../useSubscriptionUnreads';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../../../lib/methods/readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../../../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/helpers', () => ({
	getUidDirectMessage: jest.fn(),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => false)
}));

const mockGet = database.active.get as jest.Mock;
const mockGetUidDirectMessage = getUidDirectMessage as jest.Mock;
let observedStore: any;

const stubRoom = { rid: 'rid-1', t: 'c' };

// Emits subscription rows through the rid-keyed RoomStore's observer, which is the only source
// the hook reads from.
const setupObservedRoom = (rid: string) => {
	let emit: ((rows: any[]) => void) | undefined;
	const observeWithColumns = jest.fn(() => ({
		subscribe: (cb: (rows: any[]) => void) => {
			emit = cb;
			return { unsubscribe: jest.fn() };
		}
	}));
	mockGet.mockReturnValue({ query: jest.fn(() => ({ observeWithColumns })) });
	observedStore = createRoomStore({ rid, initialRoom: stubRoom });
	observeRoom(rid, observedStore);
	return { emitRow: (row: any) => act(() => emit?.([row])) };
};

describe('useSubscriptionUnreads', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetUidDirectMessage.mockReturnValue(undefined);
	});

	afterEach(() => {});

	it('maps the observed subscription to the tunread trio and isSelfDm', () => {
		mockGetUidDirectMessage.mockReturnValue('user-1');
		const { emitRow } = setupObservedRoom('rid-1');
		const { result } = renderHook(() => useSubscriptionUnreads(observedStore, 'user-1'));

		const row = { id: 'sub-1', rid: 'rid-1', t: 'd', tunread: ['a', 'b'], tunreadUser: ['a'], tunreadGroup: ['b'] };
		emitRow(row);

		expect(result.current.subscription).toBe(row);
		expect(result.current.tunread).toEqual(['a', 'b']);
		expect(result.current.tunreadUser).toEqual(['a']);
		expect(result.current.tunreadGroup).toEqual(['b']);
		expect(result.current.isSelfDm).toBe(true);
	});

	it('reports empty unreads while the room has no subscription row yet', () => {
		setupObservedRoom('rid-1');
		const { result } = renderHook(() => useSubscriptionUnreads(observedStore, 'user-1'));

		expect(result.current.tunread).toEqual([]);
		expect(result.current.isSelfDm).toBe(false);
		expect(result.current.subscription).toBeUndefined();
	});

	it('falls back to empty unreads without a rid', () => {
		const { result } = renderHook(() => useSubscriptionUnreads(createRoomStore({ initialRoom: { rid: '', t: '' } }), 'user-1'));

		expect(result.current.tunread).toEqual([]);
		expect(result.current.subscription).toBeUndefined();
	});
});
