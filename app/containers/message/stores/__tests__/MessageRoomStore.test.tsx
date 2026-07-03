import { act, render } from '@testing-library/react-native';

import { MessageRoomProvider, pickMessageRoomState, useTimeFormat } from '../MessageRoomStore';

describe('MessageRoomStore', () => {
	it('mirrors updated provider props into the store after mount', () => {
		const spy = jest.fn();
		const Probe = () => {
			spy(useTimeFormat());
			return null;
		};
		const wrap = (timeFormat: string) => (
			<MessageRoomProvider {...pickMessageRoomState({ timeFormat })}>
				<Probe />
			</MessageRoomProvider>
		);

		const { rerender } = render(wrap('MMM Do YYYY'));
		expect(spy).toHaveBeenLastCalledWith('MMM Do YYYY');

		act(() => rerender(wrap('h:mm a')));
		expect(spy).toHaveBeenLastCalledWith('h:mm a');
	});
});
