import { memo, useContext, useEffect, type ContextType } from 'react';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Provider } from 'react-redux';

import {
	MessageRoomProvider,
	MessageRoomStoreContext,
	useAutoTranslate,
	useBlockAction,
	useIsArchived,
	useNavToRoomInfo,
	useShowAttachment,
	useTimeFormat
} from '../MessageRoomStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import { updateSettings } from '../../../../actions/settings';

describe('MessageRoomStore', () => {
	describe('outside a MessageRoomProvider', () => {
		let consoleErrorSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		it('useIsArchived throws', () => {
			const Probe = () => {
				useIsArchived();
				return null;
			};
			expect(() => render(<Probe />)).toThrow('Message room hooks must be used within a MessageRoomProvider');
		});
	});

	it('mirrors updated provider props into the store after mount', () => {
		const spy = jest.fn();
		const Probe = () => {
			spy(useTimeFormat());
			return null;
		};
		const wrap = (timeFormat: string) => (
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat={timeFormat}>
					<Probe />
				</MessageRoomProvider>
			</Provider>
		);

		const { rerender } = render(wrap('MMM Do YYYY'));
		expect(spy).toHaveBeenLastCalledWith('MMM Do YYYY');

		act(() => rerender(wrap('h:mm a')));
		expect(spy).toHaveBeenLastCalledWith('h:mm a');
	});

	it('does not subscribe to Message_TimeFormat when a timeFormat prop is passed', () => {
		const spy = jest.fn();
		const Probe = () => {
			spy(useTimeFormat());
			return null;
		};

		render(
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat='literal-format'>
					<Probe />
				</MessageRoomProvider>
			</Provider>
		);
		expect(spy).toHaveBeenLastCalledWith('literal-format');
		const callsBefore = spy.mock.calls.length;

		act(() => {
			mockedStore.dispatch(updateSettings('Message_TimeFormat', 'h:mm a'));
		});

		expect(spy.mock.calls.length).toBe(callsBefore);
		expect(spy).toHaveBeenLastCalledWith('literal-format');
	});

	it('uses the Message_TimeFormat setting when no timeFormat prop is passed', () => {
		mockedStore.dispatch(updateSettings('Message_TimeFormat', 'MMM Do YYYY'));

		const spy = jest.fn();
		const Probe = () => {
			spy(useTimeFormat());
			return null;
		};

		render(
			<Provider store={mockedStore}>
				<MessageRoomProvider>
					<Probe />
				</MessageRoomProvider>
			</Provider>
		);
		expect(spy).toHaveBeenLastCalledWith('MMM Do YYYY');

		act(() => {
			mockedStore.dispatch(updateSettings('Message_TimeFormat', 'h:mm a'));
		});

		expect(spy).toHaveBeenLastCalledWith('h:mm a');
	});

	it('propagates a reactive prop change without re-rendering an unrelated consumer', () => {
		const timeFormatSpy = jest.fn();
		const autoTranslateSpy = jest.fn();
		// memoized so re-renders only come from the store notifying its own subscription,
		// not from the parent tree re-rendering with a new element identity
		const TimeFormatProbe = memo(() => {
			timeFormatSpy(useTimeFormat());
			return null;
		});
		const AutoTranslateProbe = memo(() => {
			autoTranslateSpy(useAutoTranslate());
			return null;
		});

		const wrap = (autoTranslateRoom: boolean) => (
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat='fixed-format' autoTranslateRoom={autoTranslateRoom}>
					<TimeFormatProbe />
					<AutoTranslateProbe />
				</MessageRoomProvider>
			</Provider>
		);

		const { rerender } = render(wrap(false));
		expect(autoTranslateSpy).toHaveBeenLastCalledWith({ autoTranslateRoom: false, autoTranslateLanguage: undefined });
		const timeFormatCallsBefore = timeFormatSpy.mock.calls.length;

		act(() => rerender(wrap(true)));

		expect(autoTranslateSpy).toHaveBeenLastCalledWith({ autoTranslateRoom: true, autoTranslateLanguage: undefined });
		expect(timeFormatSpy.mock.calls.length).toBe(timeFormatCallsBefore);
	});

	it('resyncs archived when a room gets archived mid-session', () => {
		const spy = jest.fn();
		const Probe = () => {
			spy(useIsArchived());
			return null;
		};
		const wrap = (archived: boolean) => (
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat='fixed-format' archived={archived}>
					<Probe />
				</MessageRoomProvider>
			</Provider>
		);

		const { rerender } = render(wrap(false));
		expect(spy).toHaveBeenLastCalledWith(false);

		act(() => rerender(wrap(true)));
		expect(spy).toHaveBeenLastCalledWith(true);
	});

	describe('handlers bag', () => {
		it('reads a handler through the fine-grained selector off the published bag', () => {
			const blockAction = jest.fn();
			const spy = jest.fn();
			const Probe = () => {
				spy(useBlockAction());
				return null;
			};

			render(
				<Provider store={mockedStore}>
					<MessageRoomProvider timeFormat='fixed-format' handlers={{ blockAction }}>
						<Probe />
					</MessageRoomProvider>
				</Provider>
			);

			expect(spy).toHaveBeenLastCalledWith(blockAction);
		});

		it('exposes navToRoomInfo/showAttachment from the handler bag', () => {
			const bagNav = jest.fn();
			const bagShow = jest.fn();
			const navSpy = jest.fn();
			const showSpy = jest.fn();
			const Probe = () => {
				navSpy(useNavToRoomInfo());
				showSpy(useShowAttachment());
				return null;
			};

			render(
				<Provider store={mockedStore}>
					<MessageRoomProvider timeFormat='fixed-format' handlers={{ navToRoomInfo: bagNav, showAttachment: bagShow }}>
						<Probe />
					</MessageRoomProvider>
				</Provider>
			);

			expect(navSpy).toHaveBeenLastCalledWith(bagNav);
			expect(showSpy).toHaveBeenLastCalledWith(bagShow);
		});

		it('publishes handlers in the reactive tail: a setState swap reaches the selector', () => {
			const first = jest.fn();
			const second = jest.fn();
			const spy = jest.fn();
			const captured: { store: ContextType<typeof MessageRoomStoreContext> } = { store: null };
			const StoreProbe = () => {
				const store = useContext(MessageRoomStoreContext);
				useEffect(() => {
					captured.store = store;
				}, [store]);
				spy(useBlockAction());
				return null;
			};

			render(
				<Provider store={mockedStore}>
					<MessageRoomProvider timeFormat='fixed-format' handlers={{ blockAction: first }}>
						<StoreProbe />
					</MessageRoomProvider>
				</Provider>
			);

			expect(spy).toHaveBeenLastCalledWith(first);

			act(() => captured.store?.setState({ handlers: { blockAction: second } }));

			expect(spy).toHaveBeenLastCalledWith(second);
		});
	});

	describe('frozen handler guard (dev)', () => {
		let warnSpy: jest.SpyInstance;

		beforeEach(() => {
			warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
		});

		afterEach(() => {
			warnSpy.mockRestore();
		});

		it('warns once when a frozen handler identity changes after mount', () => {
			const wrap = (reactionInit: () => void) => (
				<Provider store={mockedStore}>
					<MessageRoomProvider timeFormat='fixed-format' reactionInit={reactionInit}>
						<Text>probe</Text>
					</MessageRoomProvider>
				</Provider>
			);

			const { rerender } = render(wrap(() => {}));
			expect(warnSpy).not.toHaveBeenCalled();

			act(() => rerender(wrap(() => {})));

			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('reactionInit'));
		});

		it('does not warn when the same handler reference is passed across re-renders', () => {
			const reactionInit = () => {};
			const wrap = () => (
				<Provider store={mockedStore}>
					<MessageRoomProvider timeFormat='fixed-format' reactionInit={reactionInit}>
						<Text>probe</Text>
					</MessageRoomProvider>
				</Provider>
			);

			const { rerender } = render(wrap());
			act(() => rerender(wrap()));

			expect(warnSpy).not.toHaveBeenCalled();
		});
	});
});
