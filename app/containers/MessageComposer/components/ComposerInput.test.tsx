import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ComposerInput } from './ComposerInput';
import { MessageComposerProvider, useAutocompleteParams } from '../context';
import { ComposerProvider } from '../ComposerStore';
import { createMessageActionStore, MessageActionProvider } from '../../message/stores/MessageActionStore';
import { type IComposerInput } from '../interfaces';
import { loadDraftMessage } from '../../../lib/methods/draftMessage';
import { createRoomSnapshot } from '../../../lib/roomObservation';

jest.mock('react-native', () => {
	const actual = jest.requireActual('react-native');
	const React = jest.requireActual('react');
	const NativeTextInput = React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
		const nativeNode = React.useRef({
			focus: jest.fn(),
			setNativeProps: jest.fn(),
			setSelection: jest.fn()
		}).current;
		React.useImperativeHandle(ref, () => nativeNode, []);
		return React.createElement('TextInput', props);
	});
	const mocked = Object.create(Object.getPrototypeOf(actual));
	for (const key of Object.getOwnPropertyNames(actual)) {
		if (key !== 'TextInput') {
			Object.defineProperty(mocked, key, Object.getOwnPropertyDescriptor(actual, key)!);
		}
	}
	mocked.TextInput = NativeTextInput;
	return mocked;
});

jest.mock('react-redux', () => ({ useDispatch: jest.fn(() => jest.fn()) }));
jest.mock('@react-navigation/native', () => ({
	useRoute: jest.fn(() => ({ params: {} })),
	useFocusEffect: jest.fn()
}));
jest.mock('../../../lib/hooks/useAltTextSupported', () => ({ useAltTextSupported: jest.fn(() => false) }));
jest.mock('../../../lib/hooks/useMasterDetail', () => ({ useMasterDetail: jest.fn(() => false) }));
jest.mock('../../../lib/methods/helpers/helpers', () => ({ getRoomTitle: jest.fn(() => 'Room') }));
jest.mock('../../../lib/methods/helpers/externalInput', () => ({ isExternalKeyboardConnected: jest.fn(() => false) }));
jest.mock('../hooks/useIOSBackSwipeHandler', () => ({
	__esModule: true,
	default: jest.fn(() => ({ iOSBackSwipe: { current: false } }))
}));
jest.mock('../hooks/useAutoSaveDraft', () => ({ useAutoSaveDraft: jest.fn(() => ({ saveMessageDraft: jest.fn() })) }));
jest.mock('../../../lib/methods/draftMessage', () => ({ loadDraftMessage: jest.fn(() => Promise.resolve(undefined)) }));

const mockLoadDraftMessage = loadDraftMessage as jest.Mock;

const AutocompleteProbe = () => {
	const params = useAutocompleteParams();
	return <Text testID='autocomplete'>{`${params.type}:${params.text}`}</Text>;
};

const composerState = {
	rid: 'room-1',
	t: 'c',
	tmid: undefined,
	roomSnapshot: createRoomSnapshot({ rid: 'room-1', t: 'c' }),
	sharing: false,
	onRemoveQuoteMessage: jest.fn()
};

const renderInput = ({
	action,
	sharing = false
}: {
	action?: Parameters<typeof MessageActionProvider>[0]['initialAction'];
	sharing?: boolean;
} = {}) => {
	const composerRef = createRef<IComposerInput>();
	const inputRef = createRef<any>();
	const messageActionStore = createMessageActionStore(action);
	const tree = (
		<MessageActionProvider store={messageActionStore}>
			<ComposerProvider {...(composerState as any)} sharing={sharing}>
				<MessageComposerProvider>
					<>
						<ComposerInput ref={composerRef} inputRef={inputRef} />
						<AutocompleteProbe />
					</>
				</MessageComposerProvider>
			</ComposerProvider>
		</MessageActionProvider>
	);
	const rendered = render(tree);
	return { ...rendered, composerRef, inputRef, messageActionStore };
};

describe('ComposerInput', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockLoadDraftMessage.mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('updates getText synchronously and trims typed text while preserving raw native text', () => {
		const { composerRef, inputRef } = renderInput();
		const input = screen.getByTestId('message-composer-input');

		fireEvent.changeText(input, '  typed text  ');

		expect(composerRef.current?.getText()).toBe('typed text');
		expect(inputRef.current?.setNativeProps).toHaveBeenCalledWith({ text: '  typed text  ' });
	});

	it('updates getText and the native input immediately for programmatic input', () => {
		const { composerRef, inputRef } = renderInput();

		act(() => composerRef.current?.setInput('  programmatic text  '));

		expect(composerRef.current?.getText()).toBe('programmatic text');
		expect(inputRef.current?.setNativeProps).toHaveBeenCalledWith({ text: '  programmatic text  ' });
	});

	it('passes the typed raw value to debounced autocomplete before the input text is trimmed', () => {
		const { composerRef } = renderInput();
		const input = screen.getByTestId('message-composer-input');

		fireEvent(input, 'focus');
		fireEvent.changeText(input, '@alice ');
		expect(composerRef.current?.getText()).toBe('@alice');

		act(() => jest.advanceTimersByTime(500));

		// The raw trailing space makes autocomplete stop; a trimmed value would produce an @ suggestion.
		expect(screen.getByTestId('autocomplete').props.children).toBe('null:');
	});

	it('delays explicit native selection by exactly 50 ms while getText is already updated', () => {
		const { composerRef, inputRef } = renderInput();

		act(() => composerRef.current?.setInput('hello', { start: 2, end: 2 }));

		expect(composerRef.current?.getText()).toBe('hello');
		expect(inputRef.current?.setSelection).not.toHaveBeenCalled();
		act(() => jest.advanceTimersByTime(49));
		expect(inputRef.current?.setSelection).not.toHaveBeenCalled();
		act(() => jest.advanceTimersByTime(1));
		expect(inputRef.current?.setSelection).toHaveBeenCalledWith(2, 2);
	});

	it('restores an empty draft text together with its Quotes', async () => {
		mockLoadDraftMessage.mockResolvedValue(JSON.stringify({ msg: '', quotes: ['quoted-message'] }));
		const { messageActionStore } = renderInput();

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(messageActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['quoted-message'] });
	});

	it('ignores structured drafts while sharing but restores them for a Room composer', async () => {
		mockLoadDraftMessage.mockResolvedValue(JSON.stringify({ msg: 'room draft', quotes: ['room-quote'] }));
		const sharing = renderInput({ sharing: true });

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(sharing.messageActionStore.getState().action).toBeNull();
		expect(sharing.composerRef.current?.getText()).toBe('');

		const room = renderInput({ sharing: false });
		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(room.messageActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['room-quote'] });
		expect(room.composerRef.current?.getText()).toBe('room draft');
	});
});
