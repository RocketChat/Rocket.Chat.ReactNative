import { render } from '@testing-library/react-native';
import { type ComponentProps } from 'react';
import { A11y } from 'react-native-a11y-order';

import MessageContext from '../../../Context';
import ImageContainer from './Container';

jest.mock('../../../../markdown', () => {
	const React = require('react');
	const { Text } = require('react-native');

	return ({ msg }: { msg?: string }) => <Text>{msg}</Text>;
});

jest.mock('../../../hooks/useMediaAutoDownload', () => ({
	useMediaAutoDownload: jest.fn(() => ({
		status: 'downloaded',
		onPress: jest.fn(),
		url: 'https://open.rocket.chat/image.png',
		isEncrypted: false
	}))
}));

jest.mock('./Image', () => ({
	MessageImage: () => null
}));

const renderImageContainer = (props?: Partial<ComponentProps<typeof ImageContainer>>) =>
	render(
		<A11y.Order>
			<MessageContext.Provider
				value={{
					id: 'message-id',
					baseUrl: 'https://open.rocket.chat',
					user: { id: 'user-id', username: 'rocket.cat', token: 'token' },
					onLongPress: jest.fn(),
					translateLanguage: undefined
				}}>
				<ImageContainer file={{ image_url: 'https://open.rocket.chat/image.png', image_type: 'image/png' }} {...props} />
			</MessageContext.Provider>
		</A11y.Order>
	);

describe('ImageContainer', () => {
	it('sets the accessibility label on the pressable when alt text is supported', () => {
		const { getByRole } = renderImageContainer({
			isAltTextSupported: true,
			msg: 'A wavy orange and black pattern'
		});

		const button = getByRole('imagebutton');

		expect(button.props.accessibilityLabel).toBe('A wavy orange and black pattern');
		expect(button.props.accessibilityRole).toBe('imagebutton');
	});

	it('does not set the accessibility label on the pressable when alt text is not supported', () => {
		const { getByRole } = renderImageContainer();

		const button = getByRole('imagebutton');

		expect(button.props.accessibilityLabel).toBeUndefined();
		expect(button.props.accessibilityRole).toBe('imagebutton');
	});
});
