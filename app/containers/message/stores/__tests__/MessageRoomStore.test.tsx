import { memo } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Provider } from 'react-redux';

import {
	MessageRoomProvider,
	type MessageRoomState,
	useAutoTranslate,
	useBlockAction,
	useIsArchived,
	useNavToRoomInfo,
	useReactionInit,
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
			const Consumer = () => {
				useIsArchived();
				return null;
			};
			expect(() => render(<Consumer />)).toThrow('Message room hooks must be used within a MessageRoomProvider');
		});
	});

	it('mirrors updated provider props into the store after mount', () => {
		const spy = jest.fn();
		const Consumer = () => {
			spy(useTimeFormat());
			return null;
		};
		const wrap = (timeFormat: string) => (
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat={timeFormat}>
					<Consumer />
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
		const Consumer = () => {
			spy(useTimeFormat());
			return null;
		};

		render(
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat='literal-format'>
					<Consumer />
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
		const Consumer = () => {
			spy(useTimeFormat());
			return null;
		};

		render(
			<Provider store={mockedStore}>
				<MessageRoomProvider>
					<Consumer />
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
		const TimeFormatConsumer = memo(() => {
			timeFormatSpy(useTimeFormat());
			return null;
		});
		const AutoTranslateConsumer = memo(() => {
			autoTranslateSpy(useAutoTranslate());
			return null;
		});

		const wrap = (autoTranslateRoom: boolean) => (
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat='fixed-format' autoTranslateRoom={autoTranslateRoom}>
					<TimeFormatConsumer />
					<AutoTranslateConsumer />
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
		const Consumer = () => {
			spy(useIsArchived());
			return null;
		};
		const wrap = (archived: boolean) => (
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat='fixed-format' archived={archived}>
					<Consumer />
				</MessageRoomProvider>
			</Provider>
		);

		const { rerender } = render(wrap(false));
		expect(spy).toHaveBeenLastCalledWith(false);

		act(() => rerender(wrap(true)));
		expect(spy).toHaveBeenLastCalledWith(true);
	});

	describe('handlers bag', () => {
		it('reads a handler through the fine-grained selector on the first render', () => {
			const blockAction = jest.fn();
			const spy = jest.fn();
			const Consumer = () => {
				spy(useBlockAction());
				return null;
			};

			render(
				<Provider store={mockedStore}>
					<MessageRoomProvider timeFormat='fixed-format' handlers={{ blockAction }}>
						<Consumer />
					</MessageRoomProvider>
				</Provider>
			);

			expect(spy).toHaveBeenNthCalledWith(1, blockAction);
		});

		it('exposes navToRoomInfo/showAttachment from the handler bag', () => {
			const bagNav = jest.fn();
			const bagShow = jest.fn();
			const navSpy = jest.fn();
			const showSpy = jest.fn();
			const Consumer = () => {
				navSpy(useNavToRoomInfo());
				showSpy(useShowAttachment());
				return null;
			};

			render(
				<Provider store={mockedStore}>
					<MessageRoomProvider timeFormat='fixed-format' handlers={{ navToRoomInfo: bagNav, showAttachment: bagShow }}>
						<Consumer />
					</MessageRoomProvider>
				</Provider>
			);

			expect(navSpy).toHaveBeenLastCalledWith(bagNav);
			expect(showSpy).toHaveBeenLastCalledWith(bagShow);
		});

		it('resyncs the bag when the provider receives a new handlers prop', () => {
			const first = jest.fn();
			const second = jest.fn();
			const spy = jest.fn();
			const Consumer = () => {
				spy(useBlockAction());
				return null;
			};
			const tree = (blockAction: jest.Mock) => (
				<Provider store={mockedStore}>
					<MessageRoomProvider timeFormat='fixed-format' handlers={{ blockAction }}>
						<Consumer />
					</MessageRoomProvider>
				</Provider>
			);

			const { rerender } = render(tree(first));

			expect(spy).toHaveBeenLastCalledWith(first);

			rerender(tree(second));

			expect(spy).toHaveBeenLastCalledWith(second);
		});
	});

	describe('live callbacks', () => {
		const wrap = (config: Partial<MessageRoomState>) => (
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat='fixed-format' {...config}>
					<ReactionInitConsumer />
				</MessageRoomProvider>
			</Provider>
		);

		const renderSpy = jest.fn();
		const ReactionInitConsumer = memo(() => {
			const reactionInit = useReactionInit();
			renderSpy(reactionInit);
			return <Text onPress={() => reactionInit?.('message-id')}>reaction</Text>;
		});

		beforeEach(() => renderSpy.mockClear());

		it('invokes the latest callback after a rerender', () => {
			const first = jest.fn();
			const second = jest.fn();

			const { rerender } = render(wrap({ reactionInit: first }));
			act(() => rerender(wrap({ reactionInit: second })));

			fireEvent.press(screen.getByText('reaction'));

			expect(second).toHaveBeenCalledWith('message-id');
			expect(first).not.toHaveBeenCalled();
		});

		it('keeps the callback identity stable across rerenders', () => {
			const { rerender } = render(wrap({ reactionInit: jest.fn() }));
			const renderCallsBefore = renderSpy.mock.calls.length;

			act(() => rerender(wrap({ reactionInit: jest.fn() })));

			expect(renderSpy.mock.calls.length).toBe(renderCallsBefore);
		});

		it('stays undefined when the provider does not supply the callback', () => {
			render(wrap({}));

			expect(renderSpy).toHaveBeenLastCalledWith(undefined);
		});

		it('becomes defined when the provider starts supplying the callback', () => {
			const reactionInit = jest.fn();
			const { rerender } = render(wrap({}));
			expect(renderSpy).toHaveBeenLastCalledWith(undefined);

			act(() => rerender(wrap({ reactionInit })));
			fireEvent.press(screen.getByText('reaction'));

			expect(reactionInit).toHaveBeenCalledWith('message-id');
		});
	});
});
