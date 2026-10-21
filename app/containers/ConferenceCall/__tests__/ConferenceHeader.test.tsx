import { fireEvent, render } from '@testing-library/react-native';
import { type ReactElement } from 'react';
import { Text } from 'react-native';

import ConferenceHeader from '../ConferenceHeader';

interface ISetup {
	elapsedSeconds?: number;
	title?: string;
	audioOutput?: string;
	chatUnread?: number;
	chatDisabled?: boolean;
	handPill?: ReactElement | null;
	pills?: ReactElement | null;
}

const setup = ({
	elapsedSeconds = 74,
	title,
	audioOutput = 'speaker',
	chatUnread = 0,
	chatDisabled = false,
	handPill,
	pills
}: ISetup = {}) => {
	const onAudioOutputPress = jest.fn();
	const onChatPress = jest.fn();
	const utils = render(
		<ConferenceHeader
			elapsedSeconds={elapsedSeconds}
			title={title}
			audioOutput={audioOutput}
			onAudioOutputPress={onAudioOutputPress}
			chatUnread={chatUnread}
			chatDisabled={chatDisabled}
			onChatPress={onChatPress}
			handPill={handPill}
			pills={pills}
		/>
	);
	return { ...utils, onAudioOutputPress, onChatPress };
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

	it('shows how many messages are waiting in the chat, capped for large numbers', () => {
		const { getByText, rerender } = setup({ chatUnread: 7 });
		expect(getByText('7')).toBeTruthy();

		rerender(
			<ConferenceHeader
				elapsedSeconds={74}
				audioOutput='speaker'
				onAudioOutputPress={jest.fn()}
				chatUnread={250}
				chatDisabled={false}
				onChatPress={jest.fn()}
			/>
		);

		expect(getByText('99+')).toBeTruthy();
	});

	it('shows no count when the chat has nothing new', () => {
		const { queryAllByTestId } = setup({ chatUnread: 0 });

		expect(queryAllByTestId('conference-control-badge')).toHaveLength(0);
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

	it('opens the chat', () => {
		const { getByTestId, onChatPress } = setup();

		fireEvent.press(getByTestId('conference-chat-button'));

		expect(onChatPress).toHaveBeenCalledTimes(1);
	});

	it('has no people button, because the people list opens from the more menu', () => {
		const { queryByTestId, queryByLabelText } = setup();

		expect(queryByTestId('conference-people-button')).toBeNull();
		expect(queryByLabelText('People')).toBeNull();
	});

	it('shows a raised hand announcement on the same line as the buttons, without adding a row', () => {
		const { getByText, toJSON } = setup({ handPill: <Text>hand</Text> });

		expect(getByText('hand')).toBeTruthy();
		expect(JSON.stringify(toJSON())).not.toContain('flexWrap');
	});

	it('shows who is presenting on a row of its own below the buttons', () => {
		const { getByText } = setup({ pills: <Text>pill</Text> });

		expect(getByText('pill')).toBeTruthy();
	});

	it('adds no extra row when nobody is presenting', () => {
		const { toJSON } = setup({ pills: null });

		expect(JSON.stringify(toJSON())).not.toContain('flexWrap');
	});
});
