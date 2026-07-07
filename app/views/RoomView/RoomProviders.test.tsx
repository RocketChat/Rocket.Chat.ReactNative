import { render } from '@testing-library/react-native';

import { RoomProviders } from './RoomProviders';
import { useRoomContext, type IRoomContext } from './context';
import { createInteractionStore } from './InteractionStore';

describe('RoomProviders', () => {
	it('keeps the same RoomContext value reference across re-renders with unchanged props', () => {
		const store = createInteractionStore();
		const room = { rid: 'rid-1' };
		const values: IRoomContext[] = [];

		const Probe = () => {
			values.push(useRoomContext());
			return null;
		};

		const Parent = () => (
			<RoomProviders store={store} rid='rid-1' t='c' room={room}>
				<Probe />
			</RoomProviders>
		);

		const { rerender } = render(<Parent />);
		rerender(<Parent />);

		expect(values).toHaveLength(2);
		expect(values[1]).toBe(values[0]);
	});

	it('produces a new RoomContext value reference when a prop changes', () => {
		const store = createInteractionStore();
		const values: IRoomContext[] = [];

		const Probe = () => {
			values.push(useRoomContext());
			return null;
		};

		const rooms = [{ rid: 'rid-1' }, { rid: 'rid-2' }];
		const Parent = ({ roomIndex }: { roomIndex: number }) => (
			<RoomProviders store={store} rid='rid-1' t='c' room={rooms[roomIndex]}>
				<Probe />
			</RoomProviders>
		);

		const { rerender } = render(<Parent roomIndex={0} />);
		rerender(<Parent roomIndex={1} />);

		expect(values).toHaveLength(2);
		expect(values[1]).not.toBe(values[0]);
	});
});
