import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { ROOM } from '../../../../actions/actionsTypes';
import { type IRoomHistoryRequest } from '../../../../actions/room';
import { type RoomType, type TAnyMessageModel } from '../../../../definitions';
import database from '../../../../lib/database';
import { getMessageById } from '../../../../lib/database/services/Message';
import { getThreadById } from '../../../../lib/database/services/Thread';
import { MessageTypeLoad } from '../../../../lib/constants/messageTypeLoad';
import { mockedStore } from '../../../../reducers/mockedStore';
import { MAX_AUTO_LOADS } from '../constants';
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
	let emitVisibleRows: ((rows: TAnyMessageModel[]) => void) | null;

	const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

	beforeEach(() => {
		emittedRows = [];
		emitVisibleRows = null;
		jest.clearAllMocks();
		mockDbGet.mockImplementation(() => ({
			query: jest.fn().mockReturnValue({
				observe: () => ({
					subscribe: (onNext: (rows: TAnyMessageModel[]) => void) => {
						emitVisibleRows = onNext;
						onNext(emittedRows);
						return { unsubscribe: jest.fn() };
					}
				})
			})
		}));
	});

	const renderUseMessages = (overrides: Partial<Parameters<typeof useMessages>[0]> = {}) =>
		renderHook((props: Partial<Parameters<typeof useMessages>[0]> = {}) => useMessages({ ...baseArgs, ...overrides, ...props }), {
			wrapper
		});

	const buildRows = (loaderId: string) => [msg({ id: `${loaderId}-message` }), msg({ id: loaderId, t: MessageTypeLoad.MORE })];

	const emitRows = (rows: TAnyMessageModel[]) => {
		emittedRows = rows;
		act(() => {
			emitVisibleRows?.(rows);
		});
	};

	const getHistoryDispatches = (dispatchSpy: jest.SpiedFunction<typeof mockedStore.dispatch>): IRoomHistoryRequest[] =>
		dispatchSpy.mock.calls
			.map(([action]) => action)
			.filter(
				(action): action is IRoomHistoryRequest =>
					!!action && typeof action === 'object' && 'type' in action && action.type === ROOM.HISTORY_REQUEST
			);

	const getHistoryDispatchCount = (dispatchSpy: jest.SpiedFunction<typeof mockedStore.dispatch>) =>
		getHistoryDispatches(dispatchSpy).length;

	const emitLoaderSequence = async ({
		dispatchSpy,
		loaderIds,
		getExpectedCount
	}: {
		dispatchSpy: jest.SpiedFunction<typeof mockedStore.dispatch>;
		loaderIds: string[];
		getExpectedCount: (index: number) => number;
	}): Promise<void> => {
		const emitAt = async (index: number): Promise<void> => {
			if (index >= loaderIds.length) {
				return;
			}

			emitRows(buildRows(loaderIds[index]));

			await waitFor(() => {
				expect(getHistoryDispatchCount(dispatchSpy)).toBe(getExpectedCount(index));
			});

			await emitAt(index + 1);
		};

		await emitAt(0);
	};

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
			expect(result.current[1].current).toEqual(['p', 'q']);
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

	it('does not dispatch roomHistoryRequest again when loaderId has not changed', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];

		renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1);
		});

		// Simulate a new message arriving — visibleMessages changes but loaderId stays the same
		emitRows([msg({ id: 'new-msg' }), msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })]);

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1); // still only once
		});

		dispatchSpy.mockRestore();
	});

	it('caps sequential auto-load dispatches after MAX_AUTO_LOADS unique loaders', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = buildRows('loader-1');

		renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1);
		});

		await emitLoaderSequence({
			dispatchSpy,
			loaderIds: Array.from({ length: MAX_AUTO_LOADS }, (_, index) => `loader-${index + 2}`),
			getExpectedCount: index => Math.min(index + 2, MAX_AUTO_LOADS)
		});

		expect(getHistoryDispatchCount(dispatchSpy)).toBe(MAX_AUTO_LOADS);
		dispatchSpy.mockRestore();
	});

	it('resets the auto-load cap when rid changes', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = buildRows('room-a-loader-1');

		const { rerender } = renderUseMessages({
			rid: 'ROOM_A',
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1);
		});

		await emitLoaderSequence({
			dispatchSpy,
			loaderIds: Array.from({ length: MAX_AUTO_LOADS - 1 }, (_, index) => `room-a-loader-${index + 2}`),
			getExpectedCount: index => index + 2
		});

		emittedRows = buildRows('room-b-loader-1');
		rerender({
			rid: 'ROOM_B',
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(MAX_AUTO_LOADS + 1);
		});

		expect(getHistoryDispatches(dispatchSpy).at(-1)).toEqual(
			expect.objectContaining({
				rid: 'ROOM_B',
				loaderId: 'room-b-loader-1'
			})
		);
		dispatchSpy.mockRestore();
	});

	it('does not re-dispatch the old room loader immediately after navigation before new messages arrive', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = buildRows('room-a-loader');

		const { rerender } = renderUseMessages({
			rid: 'ROOM_A',
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1);
		});

		// Navigate to ROOM_B — new subscription emits a different loader immediately
		emittedRows = buildRows('room-b-loader');
		rerender({ rid: 'ROOM_B', serverVersion: '6.0.0', hideSystemMessages: ['uj'] });

		await waitFor(() => {
			// Exactly 1 dispatch for ROOM_B (not 2) — the old room-a-loader was
			// snapshotted into lastDispatchedLoaderId on rid change, so it is skipped.
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(2);
			expect(getHistoryDispatches(dispatchSpy).at(-1)).toEqual(
				expect.objectContaining({ rid: 'ROOM_B', loaderId: 'room-b-loader' })
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
		expect(getHistoryDispatchCount(dispatchSpy)).toBe(0);
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
