import { useContext, type ReactNode } from 'react';
import { render, renderHook } from '@testing-library/react-native';

import {
	ComposerProvider,
	ComposerStoreContext,
	type ComposerState,
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
} from './ComposerStore';

const room = { rid: 'rid-1', t: 'c' };

const fullProps = () => ({
	rid: 'rid-1',
	t: 'c',
	tmid: 'tmid-1',
	room,
	sharing: false,
	isAutocompleteVisible: false,
	editCancel: jest.fn(),
	editRequest: jest.fn(() => Promise.resolve()),
	onRemoveQuoteMessage: jest.fn(),
	onSendMessage: jest.fn(),
	setQuotesAndText: jest.fn(),
	getText: jest.fn(() => 'text'),
	updateAutocompleteVisible: jest.fn()
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

		expect(result.current).toEqual(props);
	});

	it('updates a consumer hook when its slice changes on re-render', () => {
		const props = fullProps();
		const spy = jest.fn();

		const Probe = () => {
			spy(useIsAutocompleteVisible());
			return null;
		};
		const Parent = ({ isAutocompleteVisible }: { isAutocompleteVisible: boolean }) => (
			<ComposerProvider {...props} isAutocompleteVisible={isAutocompleteVisible}>
				<Probe />
			</ComposerProvider>
		);

		const { rerender } = render(<Parent isAutocompleteVisible={false} />);
		expect(spy).toHaveBeenLastCalledWith(false);

		rerender(<Parent isAutocompleteVisible />);
		expect(spy).toHaveBeenLastCalledWith(true);
	});

	it('re-renders useComposerRoom when roomUpdate changes, even with the same room reference', () => {
		const mutableRoom = { rid: 'rid-1', t: 'c', name: 'old' };
		const spy = jest.fn();

		const Probe = () => {
			const room = useComposerRoom();
			spy(room && 'name' in room ? room.name : undefined);
			return null;
		};
		const Parent = ({ roomUpdate }: { roomUpdate: ComposerState['roomUpdate'] }) => (
			<ComposerProvider {...fullProps()} room={mutableRoom} roomUpdate={roomUpdate}>
				<Probe />
			</ComposerProvider>
		);

		const { rerender } = render(<Parent roomUpdate={{}} />);
		expect(spy).toHaveBeenLastCalledWith('old');

		mutableRoom.name = 'new';
		rerender(<Parent roomUpdate={{ name: 'new' }} />);
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
