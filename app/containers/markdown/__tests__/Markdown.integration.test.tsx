import { render } from '@testing-library/react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import { type Root } from '@rocket.chat/message-parser';

import Markdown from '..';
import { MESSAGE_MAX_PARSE_LENGTH } from '../parseMessage';

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn(() => false)
}));

jest.mock('~/lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn(() => [true])
}));

describe('Markdown integration', () => {
	it('serializes mentions, hashtags and links into scheme-encoded markdown and forwards link presses', () => {
		const onLinkPress = jest.fn();

		const { UNSAFE_getByType } = render(
			<Markdown
				msg='hello [my link](https://rocket.chat) @rocket.cat #general'
				onLinkPress={onLinkPress}
				mentions={[{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat', type: 'user' }]}
				username='another.user'
				channels={[{ _id: 'r1', name: 'general' }]}
			/>
		);

		const markdownText = UNSAFE_getByType(EnrichedMarkdownText);

		expect(markdownText.props.markdown).toContain('[my link](<https://rocket.chat>)');
		expect(markdownText.props.markdown).toContain('[**@rocket\\.cat**](<user://u1>)');
		expect(markdownText.props.markdown).toContain('[**\\#general**](<channel://r1>)');

		markdownText.props.onLinkPress({ url: 'https://rocket.chat' });

		expect(onLinkPress).toHaveBeenCalledWith('https://rocket.chat');
	});

	it('renders the server-parsed tree instead of parsing the text again', () => {
		const md: Root = [{ type: 'PARAGRAPH', value: [{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'from server' }] }] }];

		const { UNSAFE_getByType } = render(<Markdown msg='from text' md={md} />);

		expect(UNSAFE_getByType(EnrichedMarkdownText).props.markdown).toBe('**from server**');
	});

	it('shows a message longer than the parse limit as plain text, like the web client', () => {
		const msg = `**${'a'.repeat(MESSAGE_MAX_PARSE_LENGTH)}**`;

		const { UNSAFE_getByType } = render(<Markdown msg={msg} />);

		expect(UNSAFE_getByType(EnrichedMarkdownText).props.markdown).toBe(`\\*\\*${'a'.repeat(MESSAGE_MAX_PARSE_LENGTH)}\\*\\*`);
	});
});
