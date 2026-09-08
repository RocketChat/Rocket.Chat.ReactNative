import { act, render, screen } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type RoomStore } from '../../../definitions';
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

const createRoomStore = (room: Record<string, unknown>) => {
	const store = createStore(() => ({ room }));
	return store as typeof store & RoomStore;
};

describe('RightButtons routing', () => {
	beforeEach(() => {
		omnichannelMock.mounts.count = 0;
		threadMock.mounts.count = 0;
		roomMock.mounts.count = 0;
	});

	it('renders nothing without a rid', () => {
		render(<RightButtons roomStore={createRoomStore({ rid: 'rid-1', t: 'c' })} />);

		expectOnlyStub();
	});

	it('renders nothing for an invited room', () => {
		render(<RightButtons rid='rid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'c', status: 'INVITED' })} />);

		expectOnlyStub();
	});

	it('renders nothing for a queued omnichannel room', () => {
		render(<RightButtons rid='rid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'l', status: 'queued' })} />);

		expectOnlyStub();
	});

	it('renders nothing for an invited omnichannel room before the queued check', () => {
		render(<RightButtons rid='rid-1' roomStore={createRoomStore({ rid: 'rid-1', t: 'l', status: 'INVITED' })} />);

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
