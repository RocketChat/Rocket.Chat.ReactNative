import { memo } from 'react';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { MessageRoomProvider, useAutoTranslate, useIsArchived, useTimeFormat } from '../MessageRoomStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import { updateSettings } from '../../../../actions/settings';

describe('MessageRoomStore', () => {
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
});
