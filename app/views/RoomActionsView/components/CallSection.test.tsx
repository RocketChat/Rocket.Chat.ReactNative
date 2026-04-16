import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import CallSection from './CallSection';
import { mockedStore } from '../../../reducers/mockedStore';
import * as stories from './CallSection.stories';
import { generateSnapshots } from '../../../../.rnstorybook/generateSnapshots';
import type { ISubscription, TSubscriptionModel } from '../../../definitions';
import { SubscriptionType } from '../../../definitions';
import i18n from '../../../i18n';
import * as restApi from '../../../lib/services/restApi';

const mockShowInitCallActionSheet = jest.fn();
const mockOpenNewMediaCall = jest.fn();
const noopOpenNewMediaCall = () => undefined;

const mockUseVideoConf = jest.fn();
const mockUseNewMediaCall = jest.fn();

mockUseVideoConf.mockReturnValue({
	callEnabled: true,
	disabledTooltip: false,
	showInitCallActionSheet: mockShowInitCallActionSheet
});
mockUseNewMediaCall.mockReturnValue({
	openNewMediaCall: noopOpenNewMediaCall,
	hasMediaCallPermission: true
});

jest.mock('../../../lib/hooks/useVideoConf', () => ({
	useVideoConf: (...args: unknown[]) => mockUseVideoConf(...args)
}));

jest.mock('../../../lib/hooks/useNewMediaCall', () => ({
	useNewMediaCall: (...args: unknown[]) => mockUseNewMediaCall(...args)
}));

jest.mock('../../../lib/services/restApi', () => ({
	...jest.requireActual('../../../lib/services/restApi'),
	videoConferenceGetCapabilities: jest.fn()
}));

const mockVideoConferenceGetCapabilities = jest.mocked(restApi.videoConferenceGetCapabilities);

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const createMockRoom = (overrides: Partial<ISubscription> = {}): TSubscriptionModel =>
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
	} as TSubscriptionModel);

describe('CallSection', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseVideoConf.mockReturnValue({
			callEnabled: true,
			disabledTooltip: false,
			showInitCallActionSheet: mockShowInitCallActionSheet
		});
		mockUseNewMediaCall.mockReturnValue({
			openNewMediaCall: noopOpenNewMediaCall,
			hasMediaCallPermission: true
		});
		mockVideoConferenceGetCapabilities.mockRejectedValue(new Error('test capabilities'));
	});

	it('should return null when voice and video are both unavailable', () => {
		mockUseVideoConf.mockReturnValue({
			callEnabled: false,
			disabledTooltip: false,
			showInitCallActionSheet: mockShowInitCallActionSheet
		});
		mockUseNewMediaCall.mockReturnValue({
			openNewMediaCall: noopOpenNewMediaCall,
			hasMediaCallPermission: false
		});
		const { toJSON, queryByTestId } = render(
			<Wrapper>
				<CallSection room={createMockRoom()} disabled={false} />
			</Wrapper>
		);
		expect(toJSON()).toBeNull();
		expect(queryByTestId('room-actions-voice-call')).toBeNull();
		expect(queryByTestId('room-actions-call')).toBeNull();
	});

	it('should render voice call only when video is disabled', () => {
		mockUseVideoConf.mockReturnValue({
			callEnabled: false,
			disabledTooltip: false,
			showInitCallActionSheet: mockShowInitCallActionSheet
		});
		mockUseNewMediaCall.mockReturnValue({
			openNewMediaCall: mockOpenNewMediaCall,
			hasMediaCallPermission: true
		});
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<CallSection room={createMockRoom()} disabled={false} />
			</Wrapper>
		);
		expect(getByTestId('room-actions-voice-call')).toBeTruthy();
		expect(queryByTestId('room-actions-call')).toBeNull();
	});

	it('should render video call only when voice permission is off', () => {
		mockUseNewMediaCall.mockReturnValue({
			openNewMediaCall: noopOpenNewMediaCall,
			hasMediaCallPermission: false
		});
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<CallSection room={createMockRoom()} disabled={false} />
			</Wrapper>
		);
		expect(queryByTestId('room-actions-voice-call')).toBeNull();
		expect(getByTestId('room-actions-call')).toBeTruthy();
	});

	it('should render both voice and video rows when both are enabled', () => {
		const { getByTestId } = render(
			<Wrapper>
				<CallSection room={createMockRoom()} disabled={false} />
			</Wrapper>
		);
		expect(getByTestId('room-actions-voice-call')).toBeTruthy();
		expect(getByTestId('room-actions-call')).toBeTruthy();
	});

	it('should call openNewMediaCall when voice row is pressed', () => {
		mockUseNewMediaCall.mockReturnValue({
			openNewMediaCall: mockOpenNewMediaCall,
			hasMediaCallPermission: true
		});
		const { getByTestId } = render(
			<Wrapper>
				<CallSection room={createMockRoom()} disabled={false} />
			</Wrapper>
		);
		fireEvent.press(getByTestId('room-actions-voice-call'));
		expect(mockOpenNewMediaCall).toHaveBeenCalledTimes(1);
	});

	it('should call showInitCallActionSheet when video row is pressed', () => {
		const { getByTestId } = render(
			<Wrapper>
				<CallSection room={createMockRoom()} disabled={false} />
			</Wrapper>
		);
		fireEvent.press(getByTestId('room-actions-call'));
		expect(mockShowInitCallActionSheet).toHaveBeenCalledTimes(1);
	});

	it('should show video provider subtitle after capabilities load', async () => {
		mockVideoConferenceGetCapabilities.mockReset();
		mockVideoConferenceGetCapabilities.mockResolvedValue({ providerName: 'Rocket.Chat' } as never);
		const { getByText } = render(
			<Wrapper>
				<CallSection room={createMockRoom()} disabled={false} />
			</Wrapper>
		);
		await waitFor(() => {
			expect(getByText(i18n.t('Video_call'))).toBeTruthy();
			expect(getByText('(Rocket.Chat)')).toBeTruthy();
		});
	});

	it('should not invoke handlers when disabled prop is true', () => {
		mockUseNewMediaCall.mockReturnValue({
			openNewMediaCall: mockOpenNewMediaCall,
			hasMediaCallPermission: true
		});
		const { getByTestId } = render(
			<Wrapper>
				<CallSection room={createMockRoom()} disabled={true} />
			</Wrapper>
		);
		fireEvent.press(getByTestId('room-actions-voice-call'));
		fireEvent.press(getByTestId('room-actions-call'));
		expect(mockOpenNewMediaCall).not.toHaveBeenCalled();
		expect(mockShowInitCallActionSheet).not.toHaveBeenCalled();
	});
});

generateSnapshots(stories);
