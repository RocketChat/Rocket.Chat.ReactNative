import { act, render, screen } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type RoomMembership, type RoomStore } from '../../../definitions';
import RightButtons from '../RightButtons';

jest.mock('../OmnichannelRightButtons', () => {
	const ReactActual = jest.requireActual('react');
	const mounts = { count: 0 };
	return {
		mounts,
		OmnichannelRightButtons: ({ rid }: { rid: string }) => {
			ReactActual.useEffect(() => {
				mounts.count += 1;
			}, []);
			return ReactActual.createElement('OmnichannelRightButtons', { rid, testID: 'omnichannel-right-buttons-stub' });
		}
	};
});

jest.mock('../ThreadRightButtons', () => {
	const ReactActual = jest.requireActual('react');
	const mounts = { count: 0 };
	return {
		mounts,
		ThreadRightButtons: ({ tmid }: { tmid: string }) => {
			ReactActual.useEffect(() => {
				mounts.count += 1;
			}, []);
			return ReactActual.createElement('ThreadRightButtons', { tmid, testID: 'thread-right-buttons-stub' });
		}
	};
});

jest.mock('../RoomRightButtons', () => {
	const ReactActual = jest.requireActual('react');
	const mounts = { count: 0 };
	return {
		mounts,
		RoomRightButtons: ({ rid }: { rid: string }) => {
			ReactActual.useEffect(() => {
				mounts.count += 1;
			}, []);
			return ReactActual.createElement('RoomRightButtons', { rid, testID: 'room-right-buttons-stub' });
		}
	};
});

const omnichannelMock = jest.requireMock('../OmnichannelRightButtons') as { mounts: { count: number } };
const threadMock = jest.requireMock('../ThreadRightButtons') as { mounts: { count: number } };
const roomMock = jest.requireMock('../RoomRightButtons') as { mounts: { count: number } };

const stubIDs = ['omnichannel-right-buttons-stub', 'thread-right-buttons-stub', 'room-right-buttons-stub'];

const expectOnlyStub = (present?: string) => {
	stubIDs.forEach(id => {
		if (id === present) {
			expect(screen.getByTestId(id)).toBeOnTheScreen();
		} else {
			expect(screen.queryByTestId(id)).not.toBeOnTheScreen();
		}
	});
};

const createRoomStore = (room: Record<string, unknown>, membership: RoomMembership = 'subscribed') => {
	const store = createStore(() => ({ room: { id: 'sub-1', ...room }, membership }));
	return store as typeof store & RoomStore;
};

describe('RightButtons routing', () => {
	beforeEach(() => {
		omnichannelMock.mounts.count = 0;
		threadMock.mounts.count = 0;
		roomMock.mounts.count = 0;
	});

	it('renders nothing without a rid', () => {
		const { toJSON } = render(<RightButtons roomStore={createRoomStore({ rid: 'rid-1', t: 'c' })} />);

		expect(toJSON()).toBeNull();
		expectOnlyStub();
	});

	it('renders nothing for an invited room', () => {
		const { toJSON } = render(<RightButtons rid='rid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'c' }, 'invited')} />);

		expect(toJSON()).toBeNull();
		expectOnlyStub();
	});

	it('renders nothing for a queued omnichannel room', () => {
		const { toJSON } = render(
			<RightButtons rid='rid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'l', status: 'queued' })} />
		);

		expect(toJSON()).toBeNull();
		expectOnlyStub();
	});

	it('renders nothing for an omnichannel room still in the preview window', () => {
		const store = createStore(() => ({ room: { rid: 'rid-1', t: 'l' }, membership: 'preview' as RoomMembership }));

		render(<RightButtons rid='rid-1' roomStore={store as unknown as RoomStore} />);

		expectOnlyStub();
	});

	it('renders nothing for an invited omnichannel room before the queued check', () => {
		render(<RightButtons rid='rid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'l' }, 'invited')} />);

		expectOnlyStub();
	});

	it('renders the omnichannel buttons for an active omnichannel room even with a tmid', () => {
		render(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'l' })} />);

		expectOnlyStub('omnichannel-right-buttons-stub');
		expect(screen.getByTestId('omnichannel-right-buttons-stub')).toHaveProp('rid', 'rid-1');
	});

	it('renders the thread buttons when a tmid is given', () => {
		render(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'c' })} />);

		expectOnlyStub('thread-right-buttons-stub');
		expect(screen.getByTestId('thread-right-buttons-stub')).toHaveProp('tmid', 'tmid-1');
	});

	it('renders the room buttons for a regular room', () => {
		render(<RightButtons rid='rid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'c' })} />);

		expectOnlyStub('room-right-buttons-stub');
		expect(screen.getByTestId('room-right-buttons-stub')).toHaveProp('rid', 'rid-1');
	});

	it('swaps the room buttons for the omnichannel buttons when the room type changes in place', () => {
		const roomStore = createRoomStore({ rid: 'rid-1', t: 'c' });
		render(<RightButtons rid='rid-1' roomStore={roomStore} />);

		expectOnlyStub('room-right-buttons-stub');
		expect(roomMock.mounts.count).toBe(1);

		act(() => roomStore.setState({ room: { rid: 'rid-1', t: 'l' } }));

		expectOnlyStub('omnichannel-right-buttons-stub');
		expect(omnichannelMock.mounts.count).toBe(1);
		expect(roomMock.mounts.count).toBe(1);
	});

	it('remounts into the thread buttons when a tmid appears', () => {
		const roomStore = createRoomStore({ rid: 'rid-1', t: 'c' });
		render(<RightButtons rid='rid-1' roomStore={roomStore} />);

		expectOnlyStub('room-right-buttons-stub');
		expect(roomMock.mounts.count).toBe(1);

		screen.rerender(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={roomStore} />);

		expectOnlyStub('thread-right-buttons-stub');
		expect(threadMock.mounts.count).toBe(1);
		expect(roomMock.mounts.count).toBe(1);
	});

	it.each([
		['c', undefined, 'c', 'INVITED', undefined],
		['c', 'INVITED', 'c', undefined, 'room-right-buttons-stub'],
		['l', undefined, 'l', 'queued', undefined],
		['l', 'queued', 'l', undefined, 'omnichannel-right-buttons-stub'],
		['c', undefined, 'l', undefined, 'omnichannel-right-buttons-stub']
	])('updates buttons when the same Room changes from %s/%s to %s/%s', (t, status, nextType, nextStatus, expected) => {
		const room = { id: 'sub-1', rid: 'rid-1', t, status };
		const roomStore = createRoomStore(room, status === 'INVITED' ? 'invited' : 'subscribed');
		render(<RightButtons rid='rid-1' roomStore={roomStore} />);

		act(() => {
			Object.assign(room, { t: nextType, status: nextStatus });
			roomStore.setState({ room, membership: nextStatus === 'INVITED' ? 'invited' : 'subscribed' });
		});

		expectOnlyStub(expected);
	});

	it('remounts the room buttons after the tmid is cleared', () => {
		const roomStore = createRoomStore({ rid: 'rid-1', t: 'c' });
		render(<RightButtons rid='rid-1' roomStore={roomStore} />);

		screen.rerender(<RightButtons rid='rid-1' tmid='tmid-1' roomStore={roomStore} />);
		screen.rerender(<RightButtons rid='rid-1' roomStore={roomStore} />);

		expectOnlyStub('room-right-buttons-stub');
		expect(roomMock.mounts.count).toBe(2);
		expect(threadMock.mounts.count).toBe(1);
	});
});
