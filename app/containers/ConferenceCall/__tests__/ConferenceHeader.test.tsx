import { fireEvent, render } from '@testing-library/react-native';
import { type ReactElement } from 'react';
import { Text } from 'react-native';

import ConferenceHeader from '../ConferenceHeader';

interface ISetup {
	elapsedSeconds?: number;
	title?: string;
	peopleCount?: number;
	speakerOn?: boolean;
	chatUnread?: number;
	chatDisabled?: boolean;
	pills?: ReactElement | null;
}

const setup = ({
	elapsedSeconds = 74,
	title,
	peopleCount = 3,
	speakerOn = true,
	chatUnread = 0,
	chatDisabled = false,
	pills
}: ISetup = {}) => {
	const onSpeakerPress = jest.fn();
	const onPeoplePress = jest.fn();
	const onChatPress = jest.fn();
	const utils = render(
		<ConferenceHeader
			elapsedSeconds={elapsedSeconds}
			title={title}
			peopleCount={peopleCount}
			speakerOn={speakerOn}
			onSpeakerPress={onSpeakerPress}
			chatUnread={chatUnread}
			chatDisabled={chatDisabled}
			onPeoplePress={onPeoplePress}
			onChatPress={onChatPress}
			pills={pills}
		/>
	);
	return { ...utils, onSpeakerPress, onPeoplePress, onChatPress };
};

describe('ConferenceHeader', () => {
	it('shows how long the call has been going', () => {
		const { getByTestId } = setup({ elapsedSeconds: 74 });

		expect(getByTestId('conference-timer').props.children).toBe('01:14');
	});

	it('counts past an hour', () => {
		const { getByTestId } = setup({ elapsedSeconds: 3725 });

		expect(getByTestId('conference-timer').props.children).toBe('1:02:05');
	});

	it('shows the call name when it has one', () => {
		const { getByText } = setup({ title: 'Meeting in "general"' });

		expect(getByText('Meeting in "general"')).toBeTruthy();
	});

	it('shows no call name for a call without one', () => {
		const { queryByText } = setup({ title: undefined });

		expect(queryByText(/Meeting/)).toBeNull();
	});

	it('shows how many people are in the call', () => {
		const { getByText } = setup({ peopleCount: 5 });

		expect(getByText('5')).toBeTruthy();
	});

	it('shows how many messages are waiting in the chat, capped for large numbers', () => {
		const { getByText, rerender } = setup({ chatUnread: 7 });
		expect(getByText('7')).toBeTruthy();

		rerender(
			<ConferenceHeader
				elapsedSeconds={74}
				peopleCount={3}
				speakerOn
				onSpeakerPress={jest.fn()}
				chatUnread={250}
				chatDisabled={false}
				onPeoplePress={jest.fn()}
				onChatPress={jest.fn()}
			/>
		);

		expect(getByText('99+')).toBeTruthy();
	});

	it('shows no count when the chat has nothing new', () => {
		const { queryAllByTestId } = setup({ chatUnread: 0 });

		expect(queryAllByTestId('conference-control-badge')).toHaveLength(1);
	});

	it('does not open the chat before the call details are known', () => {
		const { getByTestId, onChatPress } = setup({ chatDisabled: true });

		fireEvent.press(getByTestId('conference-chat-button'));

		expect(onChatPress).not.toHaveBeenCalled();
	});

	it('switches the speaker with one tap', () => {
		const { getByTestId, onSpeakerPress } = setup();

		fireEvent.press(getByTestId('conference-speaker-button'));

		expect(onSpeakerPress).toHaveBeenCalledTimes(1);
	});

	it('opens the people list and the chat', () => {
		const { getByTestId, onPeoplePress, onChatPress } = setup();

		fireEvent.press(getByTestId('conference-people-button'));
		fireEvent.press(getByTestId('conference-chat-button'));

		expect(onPeoplePress).toHaveBeenCalledTimes(1);
		expect(onChatPress).toHaveBeenCalledTimes(1);
	});

	it('shows whatever the call wants to announce on a row of its own below the buttons', () => {
		const { getByText } = setup({ pills: <Text>pill</Text> });

		expect(getByText('pill')).toBeTruthy();
	});

	it('adds no extra row when there is nothing to announce', () => {
		const { toJSON } = setup({ pills: null });

		expect(JSON.stringify(toJSON())).not.toContain('flexWrap');
	});
});
