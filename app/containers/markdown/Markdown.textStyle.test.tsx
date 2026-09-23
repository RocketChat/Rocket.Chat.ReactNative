import { render } from '@testing-library/react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

import Markdown from '.';

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn(() => false)
}));

jest.mock('~/lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn(() => [true])
}));

describe('Markdown textStyle integration', () => {
	it('serializes mentions, hashtags and links into scheme-encoded markdown and propagates textStyle', () => {
		const onLinkPress = jest.fn();
		const textStyle = { fontSize: 17 };

		const { UNSAFE_getByType } = render(
			<Markdown
				msg='hello [my link](https://rocket.chat) @rocket.cat #general'
				textStyle={textStyle}
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
		expect(markdownText.props.containerStyle).toEqual(textStyle);

		markdownText.props.onLinkPress({ url: 'https://rocket.chat' });

		expect(onLinkPress).toHaveBeenCalledWith('https://rocket.chat');
	});
});
