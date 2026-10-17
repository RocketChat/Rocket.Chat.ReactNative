import { fireEvent, render } from '@testing-library/react-native';

import ConferenceHeader from '../ConferenceHeader';

interface ISetup {
	elapsedSeconds?: number;
	title?: string;
	peopleCount?: number;
	audioOutput?: string;
	chatUnread?: number;
	chatDisabled?: boolean;
}

const setup = ({
	elapsedSeconds = 74,
	title,
	peopleCount = 3,
	audioOutput = 'speaker',
	chatUnread = 0,
	chatDisabled = false
}: ISetup = {}) => {
	const onAudioOutputPress = jest.fn();
	const onPeoplePress = jest.fn();
	const onChatPress = jest.fn();
	const utils = render(
		<ConferenceHeader
			elapsedSeconds={elapsedSeconds}
			title={title}
			peopleCount={peopleCount}
			audioOutput={audioOutput}
			onAudioOutputPress={onAudioOutputPress}
			chatUnread={chatUnread}
			chatDisabled={chatDisabled}
			onPeoplePress={onPeoplePress}
			onChatPress={onChatPress}
		/>
	);
	return { ...utils, onAudioOutputPress, onPeoplePress, onChatPress };
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
				audioOutput='speaker'
				onAudioOutputPress={jest.fn()}
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

	it('opens the choice of audio outputs from the speaker button', () => {
		const { getByTestId, onAudioOutputPress } = setup();

		fireEvent.press(getByTestId('conference-speaker-button'));

		expect(onAudioOutputPress).toHaveBeenCalledTimes(1);
	});

	it.each(['speaker', 'earpiece', 'headset', 'bluetooth', 'default'])(
		'stays one button whichever output (%s) is in use',
		audioOutput => {
			const { getByLabelText } = setup({ audioOutput });

			expect(getByLabelText('Audio output')).toBeTruthy();
		}
	);

	it('opens the people list and the chat', () => {
		const { getByTestId, onPeoplePress, onChatPress } = setup();

		fireEvent.press(getByTestId('conference-people-button'));
		fireEvent.press(getByTestId('conference-chat-button'));

		expect(onPeoplePress).toHaveBeenCalledTimes(1);
		expect(onChatPress).toHaveBeenCalledTimes(1);
	});
});
