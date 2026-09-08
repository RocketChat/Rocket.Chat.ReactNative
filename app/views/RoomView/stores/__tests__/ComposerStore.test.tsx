import { useContext, type ReactNode } from 'react';
import { act, render, renderHook } from '@testing-library/react-native';

import { type ComposerState } from '../../definitions';
import {
	ComposerProvider,
	ComposerStoreContext,
	useComposerRid,
	useComposerType,
	useComposerTmid,
	useComposerRoom,
	useComposerSharing,
	useIsAutocompleteVisible,
	useEditCancel,
	useEditRequest,
	useOnRemoveQuoteMessage,
	useOnSendMessage,
	useSetQuotesAndText,
	useGetText,
	useUpdateAutocompleteVisible
} from '../ComposerStore';

const room = { rid: 'rid-1', t: 'c' };

const fullProps = () => ({
	rid: 'rid-1',
	t: 'c',
	tmid: 'tmid-1',
	roomRead: { room },
	sharing: false,
	editCancel: jest.fn(),
	editRequest: jest.fn(() => Promise.resolve()),
	onRemoveQuoteMessage: jest.fn(),
	onSendMessage: jest.fn(),
	setQuotesAndText: jest.fn(),
	getText: jest.fn(() => 'text')
});

const useAllComposerHooks = () => ({
	rid: useComposerRid(),
	t: useComposerType(),
	tmid: useComposerTmid(),
	room: useComposerRoom(),
	sharing: useComposerSharing(),
	isAutocompleteVisible: useIsAutocompleteVisible(),
	editCancel: useEditCancel(),
	editRequest: useEditRequest(),
	onRemoveQuoteMessage: useOnRemoveQuoteMessage(),
	onSendMessage: useOnSendMessage(),
	setQuotesAndText: useSetQuotesAndText(),
	getText: useGetText(),
	updateAutocompleteVisible: useUpdateAutocompleteVisible()
});

describe('ComposerStore', () => {
	it('exposes every seeded prop through its matching hook', () => {
		const props = fullProps();
		const wrapper = ({ children }: { children: ReactNode }) => <ComposerProvider {...props}>{children}</ComposerProvider>;

		const { result } = renderHook(() => useAllComposerHooks(), { wrapper });

		// isAutocompleteVisible/updateAutocompleteVisible are store-owned, not seeded props.
		const { roomRead: _roomRead, ...propsWithoutRead } = props;
		expect(result.current).toEqual({
			...propsWithoutRead,
			room: props.roomRead.room,
			isAutocompleteVisible: false,
			updateAutocompleteVisible: expect.any(Function)
		});
	});

	it('toggles isAutocompleteVisible when updateAutocompleteVisible is called', () => {
		const props = fullProps();
		const wrapper = ({ children }: { children: ReactNode }) => <ComposerProvider {...props}>{children}</ComposerProvider>;

		const { result } = renderHook(
			() => ({ isAutocompleteVisible: useIsAutocompleteVisible(), update: useUpdateAutocompleteVisible() }),
			{ wrapper }
		);

		expect(result.current.isAutocompleteVisible).toBe(false);

		act(() => result.current.update(true));
		expect(result.current.isAutocompleteVisible).toBe(true);

		act(() => result.current.update(false));
		expect(result.current.isAutocompleteVisible).toBe(false);
	});

	it('re-renders useComposerRoom when the observed read changes, even with the same room reference', () => {
		const mutableRoom = { rid: 'rid-1', t: 'c', name: 'old' };
		const spy = jest.fn();

		const Reader = () => {
			const room = useComposerRoom();
			spy(room && 'name' in room ? room.name : undefined);
			return null;
		};
		const Parent = ({ roomRead }: { roomRead: ComposerState['roomRead'] }) => (
			<ComposerProvider {...fullProps()} roomRead={roomRead}>
				<Reader />
			</ComposerProvider>
		);

		const { rerender } = render(<Parent roomRead={{ room: mutableRoom }} />);
		expect(spy).toHaveBeenLastCalledWith('old');

		mutableRoom.name = 'new';
		rerender(<Parent roomRead={{ room: mutableRoom }} />);
		expect(spy).toHaveBeenLastCalledWith('new');
	});

	it('throws when a composer hook is used outside a ComposerProvider', () => {
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

		expect(() => renderHook(() => useComposerRid())).toThrow('Composer store hooks must be used within a ComposerProvider');

		consoleError.mockRestore();
	});

	it('keeps the same store instance across re-renders (does not recreate on prop change)', () => {
		const props = fullProps();
		const spy = jest.fn();

		const Reader = () => {
			spy(useContext(ComposerStoreContext));
			return null;
		};
		const Parent = ({ sharing }: { sharing: boolean }) => (
			<ComposerProvider {...props} sharing={sharing}>
				<Reader />
			</ComposerProvider>
		);

		const { rerender } = render(<Parent sharing={false} />);
		const first = spy.mock.calls[0][0];

		rerender(<Parent sharing />);
		const last = spy.mock.calls[spy.mock.calls.length - 1][0];

		expect(last).toBe(first);
	});
});
