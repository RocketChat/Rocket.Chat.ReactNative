import { fireEvent, render } from '@testing-library/react-native';

import Markdown from '.';

jest.mock('../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn(() => false)
}));

jest.mock('../../lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn(() => [true])
}));

describe('Markdown textStyle integration', () => {
	it('propagates textStyle to link, mention, hashtag and plain text while preserving link interaction', () => {
		const onLinkPress = jest.fn();
		const textStyle = { fontSize: 17 };

		const { getByLabelText, getByText } = render(
			<Markdown
				msg='hello [my link](https://rocket.chat) @rocket.cat #general'
				textStyle={textStyle}
				onLinkPress={onLinkPress}
				mentions={[{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat', type: 'user' }]}
				username='another.user'
				channels={[{ _id: 'r1', name: 'general' }]}
			/>
		);

		const plainTextNode = getByLabelText('hello ');
		const linkNode = getByText('my link');
		const mentionNode = getByText('@rocket.cat');
		const hashtagNode = getByText('#general');

		expect(plainTextNode.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 17 })]));
		expect(linkNode.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 17 })]));
		expect(mentionNode.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 17 })]));
		expect(hashtagNode.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 17 })]));

		fireEvent.press(linkNode);

		expect(onLinkPress).toHaveBeenCalledWith('https://rocket.chat');
	});
});
