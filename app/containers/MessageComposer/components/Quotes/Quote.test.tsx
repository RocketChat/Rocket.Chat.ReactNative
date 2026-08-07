import { render } from '@testing-library/react-native';

import { Quote } from './Quote';

const mockMessage: {
	msg: string;
	channels?: { _id: string; name: string; fname?: string }[];
	u: { username: string };
	id: string;
} = {
	id: 'm1',
	msg: 'see #2P3ydWKGPhoXrbxJL',
	channels: [{ _id: 'r1', name: '2P3ydWKGPhoXrbxJL', fname: 'My Discussion' }],
	u: { username: 'alice' }
};

jest.mock('../../hooks', () => ({
	useMessage: jest.fn(() => mockMessage)
}));

jest.mock('../../../../views/RoomView/context', () => ({
	useRoomContext: jest.fn(() => ({ onRemoveQuoteMessage: jest.fn() }))
}));

jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn(() => false)
}));

// Pulls in the composer store, which is irrelevant to what this test asserts
jest.mock('../Buttons', () => ({
	BaseButton: () => null
}));

describe('composer Quote preview', () => {
	beforeEach(() => {
		mockMessage.channels = [{ _id: 'r1', name: '2P3ydWKGPhoXrbxJL', fname: 'My Discussion' }];
	});

	it('shows the discussion mention by fname instead of the room id', () => {
		const { queryByText } = render(<Quote messageId='m1' />);

		expect(queryByText('see #2P3ydWKGPhoXrbxJL')).toBeNull();
		expect(queryByText('see #My Discussion')).toBeTruthy();
	});

	it('leaves the text alone when the message has no channels', () => {
		mockMessage.channels = undefined;

		const { queryByText } = render(<Quote messageId='m1' />);

		expect(queryByText('see #2P3ydWKGPhoXrbxJL')).toBeTruthy();
	});
});
