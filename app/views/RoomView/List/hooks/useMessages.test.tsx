import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { ROOM } from '../../../../actions/actionsTypes';
import { type RoomType, type TAnyMessageModel } from '../../../../definitions';
import database from '../../../../lib/database';
import { getMessageById } from '../../../../lib/database/services/Message';
import { getThreadById } from '../../../../lib/database/services/Thread';
import { MessageTypeLoad } from '../../../../lib/constants/messageTypeLoad';
import { mockedStore } from '../../../../reducers/mockedStore';
import { useMessages } from './useMessages';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

jest.mock('../../../../lib/database/services/Message', () => ({
	getMessageById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../../../lib/services/restApi', () => ({
	readThreads: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../../lib/methods/helpers', () => {
	const actual = jest.requireActual('../../../../lib/methods/helpers');
	return {
		...actual,
		useDebounce: (fn: (...args: unknown[]) => unknown) => fn
	};
});

const mockDbGet = database.active.get as unknown as jest.Mock;
const mockGetThreadById = jest.mocked(getThreadById);
const mockGetMessageById = jest.mocked(getMessageById);

const baseArgs = {
	rid: 'ROOM_ID',
	showMessageInMainThread: true,
	hideSystemMessages: [] as string[],
	serverVersion: '3.0.0' as string | null,
	t: 'c' as RoomType
};

const msg = (overrides: Partial<TAnyMessageModel> & { id: string }): TAnyMessageModel =>
	({
		ts: new Date('2024-01-01'),
		...overrides
	} as TAnyMessageModel);

describe('useMessages', () => {
	let emittedRows: TAnyMessageModel[];

	const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

	beforeEach(() => {
		emittedRows = [];
		jest.clearAllMocks();
		mockDbGet.mockImplementation(() => ({
			query: jest.fn().mockReturnValue({
				observe: () => ({
					subscribe: (onNext: (rows: TAnyMessageModel[]) => void) => {
						onNext(emittedRows);
						return { unsubscribe: jest.fn() };
					}
				})
			})
		}));
	});

	const renderUseMessages = (overrides: Partial<Parameters<typeof useMessages>[0]> = {}) =>
		renderHook(() => useMessages({ ...baseArgs, ...overrides }), { wrapper });

	it('returns fetchMessages as a function', async () => {
		emittedRows = [msg({ id: 'm1' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(typeof result.current[2]).toBe('function');
		});
	});

	it('loads main room messages from the messages collection', async () => {
		emittedRows = [msg({ id: 'a' }), msg({ id: 'b' })];
		const { result } = renderUseMessages({ rid: 'R1' });
		await waitFor(() => {
			expect(result.current[0].map(m => m.id)).toEqual(['a', 'b']);
		});
		expect(mockDbGet).toHaveBeenCalledWith('messages');
	});

	it('does not query the database when rid is empty', async () => {
		emittedRows = [msg({ id: 'x' })];
		const { result } = renderUseMessages({ rid: '' });
		await act(async () => {
			await result.current[2]();
		});
		expect(mockDbGet).not.toHaveBeenCalled();
	});

	it('filters out system message types listed in hideSystemMessages', async () => {
		emittedRows = [msg({ id: '1', t: 'uj' }), msg({ id: '2', t: undefined }), msg({ id: '3', t: 'room_changed_topic' })];
		const { result } = renderUseMessages({ hideSystemMessages: ['uj'] });
		await waitFor(() => {
			expect(result.current[0].map(m => m.id)).toEqual(['2', '3']);
		});
	});

	it('returns visibleMessagesIds aligned with visible messages', async () => {
		emittedRows = [msg({ id: 'p' }), msg({ id: 'q' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(result.current[1]).toEqual(['p', 'q']);
		});
	});

	it('dispatches room history request when server is 3.16+, user hides system messages, and a load row exists', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'm1', t: undefined }), msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];
		renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(dispatchSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					type: ROOM.HISTORY_REQUEST,
					rid: 'ROOM_ID',
					t: 'c',
					loaderId: 'load-more-x'
				})
			);
		});
		dispatchSpy.mockRestore();
	});

	it('does not dispatch room history request when server is below 3.16', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];
		const { result } = renderUseMessages({
			serverVersion: '3.15.0',
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(result.current[0].length).toBeGreaterThan(0);
		});
		const historyDispatches = dispatchSpy.mock.calls.filter(([a]: any) => a?.type === ROOM.HISTORY_REQUEST);
		expect(historyDispatches.length).toBe(0);
		dispatchSpy.mockRestore();
	});

	it('queries thread_messages and appends thread parent when tmid is set', async () => {
		const parent = {
			...msg({ id: 'parent-thread', t: 'discussion-created' }),
			collection: { table: 'threads' }
		} as TAnyMessageModel;
		mockGetThreadById.mockResolvedValueOnce(parent);
		emittedRows = [msg({ id: 'tm1', tmid: 'THREAD_ID' })];
		const { result } = renderUseMessages({ tmid: 'THREAD_ID' });
		await waitFor(() => {
			expect(mockDbGet).toHaveBeenCalledWith('thread_messages');
		});
		await waitFor(() => {
			const ids = result.current[0].map(m => m.id);
			expect(ids).toContain('parent-thread');
			expect(ids).toContain('tm1');
		});
	});

	it('falls back to getMessageById when thread record is missing', async () => {
		const parent = msg({ id: 'fallback-parent', t: undefined });
		mockGetThreadById.mockResolvedValueOnce(null);
		mockGetMessageById.mockResolvedValueOnce(parent as TAnyMessageModel);
		emittedRows = [msg({ id: 'only-child', tmid: 'TM' })];
		const { result } = renderUseMessages({ tmid: 'TM' });
		await waitFor(() => {
			expect(result.current[0].map(m => m.id)).toContain('fallback-parent');
		});
	});
});
