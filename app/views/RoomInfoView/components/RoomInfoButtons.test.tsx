import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { RoomInfoButtons } from './RoomInfoButtons';
import { mockedStore } from '../../../reducers/mockedStore';
import * as stories from './RoomInfoButtons.stories';
import { generateSnapshots } from '../../../../.rnstorybook/generateSnapshots';
import type { ISubscription } from '../../../definitions';
import { SubscriptionType } from '../../../definitions';

const mockShowInitCallActionSheet = jest.fn();
const mockShowActionSheet = jest.fn();
const mockStartCallByRoom = jest.fn();

const mockUseVideoConf = jest.fn();
const mockUseMediaCallPermission = jest.fn();

jest.mock('../../../lib/hooks/useVideoConf', () => ({
	useVideoConf: (...args: unknown[]) => mockUseVideoConf(...args)
}));

jest.mock('../../../lib/hooks/useMediaCallPermission', () => ({
	useMediaCallPermission: (...args: unknown[]) => mockUseMediaCallPermission(...args)
}));

jest.mock('../hooks', () => ({
	useE2EEWarning: () => false
}));

jest.mock('../../../containers/ActionSheet', () => ({
	...jest.requireActual('../../../containers/ActionSheet'),
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet })
}));

jest.mock('../../../lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: {
		startCallByRoom: (room: ISubscription) => mockStartCallByRoom(room)
	}
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const createMockRoom = (overrides: Partial<ISubscription> = {}): ISubscription =>
	({
		_id: 'room1',
		rid: 'room1',
		id: 'room1',
		t: SubscriptionType.DIRECT,
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
	} as ISubscription);

const defaultProps = {
	rid: 'room1',
	room: createMockRoom(),
	roomUserId: 'user123',
	isDirect: true,
	fromRid: 'room1',
	roomFromRid: undefined as ISubscription | undefined,
	serverVersion: '7.0.0' as string | null,
	itsMe: false,
	handleCreateDirectMessage: jest.fn(),
	handleIgnoreUser: jest.fn(),
	handleBlockUser: jest.fn(),
	handleReportUser: jest.fn()
};

describe('RoomInfoButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseVideoConf.mockReturnValue({
			callEnabled: true,
			disabledTooltip: false,
			showInitCallActionSheet: mockShowInitCallActionSheet
		});
		mockUseMediaCallPermission.mockReturnValue(true);
	});

	it('should render Message button', () => {
		const { getByText } = render(
			<Wrapper>
				<RoomInfoButtons {...defaultProps} />
			</Wrapper>
		);
		expect(getByText('Message')).toBeTruthy();
	});

	it('should call handleCreateDirectMessage when Message is pressed', () => {
		const handleCreateDirectMessage = jest.fn();
		const { getByTestId } = render(
			<Wrapper>
				<RoomInfoButtons {...defaultProps} handleCreateDirectMessage={handleCreateDirectMessage} />
			</Wrapper>
		);
		fireEvent.press(getByTestId('room-info-view-message'));
		expect(handleCreateDirectMessage).toHaveBeenCalledTimes(1);
	});

	it('should call mediaSessionInstance.startCallByRoom when Voice call is pressed', () => {
		const mockRoom = createMockRoom();
		const { getByTestId } = render(
			<Wrapper>
				<RoomInfoButtons {...defaultProps} room={mockRoom} />
			</Wrapper>
		);
		fireEvent.press(getByTestId('room-info-view-phone'));
		expect(mockStartCallByRoom).toHaveBeenCalledTimes(1);
		expect(mockStartCallByRoom).toHaveBeenCalledWith(mockRoom);
	});

	it('should call showInitCallActionSheet when Video call is pressed', () => {
		const { getByTestId } = render(
			<Wrapper>
				<RoomInfoButtons {...defaultProps} />
			</Wrapper>
		);
		fireEvent.press(getByTestId('room-info-view-camera'));
		expect(mockShowInitCallActionSheet).toHaveBeenCalledTimes(1);
	});

	it('should not render Voice call when useMediaCallPermission returns false', () => {
		mockUseMediaCallPermission.mockReturnValue(false);
		const { queryByTestId } = render(
			<Wrapper>
				<RoomInfoButtons {...defaultProps} />
			</Wrapper>
		);
		expect(queryByTestId('room-info-view-phone')).toBeNull();
	});

	it('should not render Video call when useVideoConf returns callEnabled false', () => {
		mockUseVideoConf.mockReturnValue({
			callEnabled: false,
			disabledTooltip: false,
			showInitCallActionSheet: mockShowInitCallActionSheet
		});
		const { queryByTestId } = render(
			<Wrapper>
				<RoomInfoButtons {...defaultProps} />
			</Wrapper>
		);
		expect(queryByTestId('room-info-view-camera')).toBeNull();
	});

	it('should render More button when more than 4 items are visible', () => {
		const { getByTestId } = render(
			<Wrapper>
				<RoomInfoButtons {...defaultProps} />
			</Wrapper>
		);
		expect(getByTestId('room-info-view-kebab')).toBeTruthy();
	});
});

generateSnapshots(stories);
