import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createElement, type ReactNode } from 'react';

import database from '../../../../../lib/database';
import { MessageTypeLoad } from '../../../../../lib/constants/messageTypeLoad';
import { mockedStore } from '../../../../../reducers/mockedStore';
import { useMessages } from '../useMessages';

jest.mock('../../../../../lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

jest.mock('../../../../../lib/database/services/Message', () => ({
	getMessageById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../../../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../../../../lib/services/restApi', () => ({
	readThreads: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../../../lib/methods/helpers', () => {
	const actual = jest.requireActual('../../../../../lib/methods/helpers');
	return {
		...actual,
		useDebounce: (fn: (...args: unknown[]) => unknown) => Object.assign(fn, { cancel: jest.fn() })
	};
});

const mockDbGet = database.active.get as unknown as jest.Mock;

const baseArgs = {
	rid: 'ROOM_ID',
	showMessageInMainThread: true,
	serverVersion: '3.0.0' as string | null,
	t: 'c' as const
};

const message = (id: string, t?: string) => ({ id, t });

describe('visible system messages', () => {
	let visibleRows: ReturnType<typeof message>[];

	beforeEach(() => {
		visibleRows = [];
		jest.clearAllMocks();
		mockDbGet.mockReturnValue({
			query: jest.fn(() => ({
				observe: () => ({
					subscribe: (onNext: (rows: ReturnType<typeof message>[]) => void) => {
						onNext(visibleRows);
						return { unsubscribe: jest.fn() };
					}
				})
			}))
		});
	});

	const renderMessages = (hideSystemMessages: string[]) =>
		renderHook(() => useMessages({ ...baseArgs, hideSystemMessages }), {
			wrapper: ({ children }: { children: ReactNode }) => createElement(Provider, { store: mockedStore, children }, children)
		});

	it('returns no rows when the database has no visible messages', async () => {
		const { result } = renderMessages(['uj']);

		await waitFor(() => expect(result.current[0]).toEqual([]));
	});

	it('returns visible messages and load rows while hidden system messages are absent', async () => {
		visibleRows = [message('regular'), message('load-more', MessageTypeLoad.MORE)];
		const { result } = renderMessages(['uj']);

		await waitFor(() => expect(result.current[0]).toEqual(visibleRows));
	});

	it('updates the rendered rows when the database emits a filtered result', async () => {
		let emitRows: ((rows: ReturnType<typeof message>[]) => void) | undefined;
		mockDbGet.mockReturnValue({
			query: jest.fn(() => ({
				observe: () => ({
					subscribe: (onNext: (rows: ReturnType<typeof message>[]) => void) => {
						emitRows = onNext;
						onNext([message('regular')]);
						return { unsubscribe: jest.fn() };
					}
				})
			}))
		});
		const { result } = renderMessages(['uj']);

		await waitFor(() => expect(result.current[0]).toEqual([message('regular')]));

		act(() => emitRows?.([message('regular'), message('load-more', MessageTypeLoad.MORE)]));
		await waitFor(() => expect(result.current[0]).toEqual([message('regular'), message('load-more', MessageTypeLoad.MORE)]));
	});
});
