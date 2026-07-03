import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { MessageRoomProvider, useTimeFormat } from '../MessageRoomStore';
import { mockedStore } from '../../../../reducers/mockedStore';

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
});
