import { useContext, type ReactNode } from 'react';
import { act, render, renderHook } from '@testing-library/react-native';

import {
	ComposerProvider,
	ComposerStoreContext,
	useComposerRid,
	useComposerType,
	useComposerTmid,
	useComposerRoomTitle,
	useComposerSharing,
	useIsAutocompleteVisible,
	useEditCancel,
	useEditRequest,
	useOnRemoveQuoteMessage,
	useOnSendMessage,
	useUpdateAutocompleteVisible
} from './ComposerStore';

const fullProps = () => ({
	rid: 'rid-1',
	t: 'c',
	tmid: 'tmid-1',
	roomTitle: 'Room 1',
	sharing: false,
	editCancel: jest.fn(),
	editRequest: jest.fn(() => Promise.resolve()),
	onRemoveQuoteMessage: jest.fn(),
	onSendMessage: jest.fn()
});

const useAllComposerHooks = () => ({
	rid: useComposerRid(),
	t: useComposerType(),
	tmid: useComposerTmid(),
	roomTitle: useComposerRoomTitle(),
	sharing: useComposerSharing(),
	isAutocompleteVisible: useIsAutocompleteVisible(),
	editCancel: useEditCancel(),
	editRequest: useEditRequest(),
	onRemoveQuoteMessage: useOnRemoveQuoteMessage(),
	onSendMessage: useOnSendMessage(),
	updateAutocompleteVisible: useUpdateAutocompleteVisible()
});

describe('ComposerStore', () => {
	it('exposes every seeded prop through its matching hook', () => {
		const props = fullProps();
		const wrapper = ({ children }: { children: ReactNode }) => <ComposerProvider {...props}>{children}</ComposerProvider>;

		const { result } = renderHook(() => useAllComposerHooks(), { wrapper });

		// isAutocompleteVisible/updateAutocompleteVisible are store-owned, not seeded props.
		expect(result.current).toEqual({ ...props, isAutocompleteVisible: false, updateAutocompleteVisible: expect.any(Function) });
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

	it('re-renders useComposerRoomTitle when roomTitle changes', () => {
		const spy = jest.fn();

		const Probe = () => {
			const roomTitle = useComposerRoomTitle();
			spy(roomTitle);
			return null;
		};
		const Parent = ({ roomTitle }: { roomTitle: string }) => (
			<ComposerProvider {...fullProps()} roomTitle={roomTitle}>
				<Probe />
			</ComposerProvider>
		);

		const { rerender } = render(<Parent roomTitle='old' />);
		expect(spy).toHaveBeenLastCalledWith('old');

		rerender(<Parent roomTitle='new' />);
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

		const Probe = () => {
			spy(useContext(ComposerStoreContext));
			return null;
		};
		const Parent = ({ sharing }: { sharing: boolean }) => (
			<ComposerProvider {...props} sharing={sharing}>
				<Probe />
			</ComposerProvider>
		);

		const { rerender } = render(<Parent sharing={false} />);
		const first = spy.mock.calls[0][0];

		rerender(<Parent sharing />);
		const last = spy.mock.calls[spy.mock.calls.length - 1][0];

		expect(last).toBe(first);
	});
});
