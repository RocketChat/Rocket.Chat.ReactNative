import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Item from './Item';
import { mockedStore } from '../../reducers/mockedStore';
import { setUser } from '../../actions/login';
import * as stories from './Item.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import type { TSubscriptionModel } from '../../definitions';

const mockStartCallByRoom = jest.fn();

jest.mock('../../lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: {
		startCallByRoom: (room: TSubscriptionModel) => mockStartCallByRoom(room)
	}
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const createMockRoom = (overrides: Partial<TSubscriptionModel> = {}): TSubscriptionModel =>
	({
		_id: 'room1',
		rid: 'room1',
		id: 'room1',
		t: 'd',
		name: 'john.doe',
		fname: 'John Doe',
		uids: ['abc', 'user123'],
		ls: new Date(),
		ts: new Date(),
		lm: '',
		lr: '',
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		tunread: [],
		open: true,
		alert: false,
		f: false,
		archived: false,
		roomUpdatedAt: new Date(),
		ro: false,
		...overrides
	}) as TSubscriptionModel;

describe('NewMessageView Item', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat' }));
	});

	it('should render correctly', () => {
		const { getByTestId } = render(
			<Wrapper>
				<Item
					room={createMockRoom()}
					name='John Doe'
					username='john.doe'
					onPress={() => {}}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		expect(getByTestId('new-message-view-item-john.doe')).toBeTruthy();
	});

	it('should display the name', () => {
		const { getByText } = render(
			<Wrapper>
				<Item
					room={createMockRoom()}
					name='John Doe'
					username='john.doe'
					onPress={() => {}}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		expect(getByText('John Doe')).toBeTruthy();
	});

	it('should call onPress when main item is pressed', () => {
		const onPressMock = jest.fn();
		const { getByTestId } = render(
			<Wrapper>
				<Item
					room={createMockRoom()}
					name='John Doe'
					username='john.doe'
					onPress={onPressMock}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		fireEvent.press(getByTestId('new-message-view-item-john.doe'));
		expect(onPressMock).toHaveBeenCalledTimes(1);
	});

	it('should call onLongPress when main item is long pressed', () => {
		const onLongPressMock = jest.fn();
		const { getByTestId } = render(
			<Wrapper>
				<Item
					room={createMockRoom()}
					name='John Doe'
					username='john.doe'
					onPress={() => {}}
					onLongPress={onLongPressMock}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		fireEvent(getByTestId('new-message-view-item-john.doe'), 'longPress');
		expect(onLongPressMock).toHaveBeenCalledTimes(1);
	});

	it('should call mediaSessionInstance.startCallByRoom when call button is pressed', () => {
		const mockRoom = createMockRoom();
		const { getByTestId } = render(
			<Wrapper>
				<Item
					room={mockRoom}
					name='John Doe'
					username='john.doe'
					onPress={() => {}}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		fireEvent.press(getByTestId('new-message-view-item-john.doe-call'));
		expect(mockStartCallByRoom).toHaveBeenCalledTimes(1);
		expect(mockStartCallByRoom).toHaveBeenCalledWith(mockRoom);
	});

	it('should not call startCallByRoom when room is undefined and call button is pressed', () => {
		const { getByTestId } = render(
			<Wrapper>
				<Item
					room={null as any}
					name='John Doe'
					username='john.doe'
					onPress={() => {}}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		fireEvent.press(getByTestId('new-message-view-item-john.doe-call'));
		expect(mockStartCallByRoom).not.toHaveBeenCalled();
	});

	it('should have correct accessibility label', () => {
		const { getByLabelText } = render(
			<Wrapper>
				<Item
					room={createMockRoom()}
					name='John Doe'
					username='john.doe'
					onPress={() => {}}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		expect(getByLabelText('John Doe')).toBeTruthy();
	});
});

generateSnapshots(stories);
