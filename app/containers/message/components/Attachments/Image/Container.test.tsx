import { render } from '@testing-library/react-native';
import { type ComponentProps } from 'react';
import { A11y } from 'react-native-a11y-order';
import { Provider } from 'react-redux';

import { type TAnyMessageModel } from '../../../../../definitions';
import { MessageProvider } from '../../../stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '../../../stores/MessageRoomStore';
import { mockedStore } from '../../../../../reducers/mockedStore';
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

const mockUseAltTextSupported = jest.fn();
jest.mock('../../../../../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: () => mockUseAltTextSupported()
}));

const renderImageContainer = (props?: Partial<ComponentProps<typeof ImageContainer>>) => {
	const id = 'message-id';
	const contextValue: Partial<MessageRoomState> = {
		baseUrl: 'https://open.rocket.chat',
		user: { id: 'user-id', username: 'rocket.cat', token: 'token' }
	};
	const item = { id } as unknown as TAnyMessageModel;
	return render(
		<Provider store={mockedStore}>
			<A11y.Order>
				<MessageRoomProvider {...contextValue}>
					<MessageProvider item={item}>
						<ImageContainer file={{ image_url: 'https://open.rocket.chat/image.png', image_type: 'image/png' }} {...props} />
					</MessageProvider>
				</MessageRoomProvider>
			</A11y.Order>
		</Provider>
	);
};

describe('ImageContainer', () => {
	beforeEach(() => {
		mockUseAltTextSupported.mockReset();
	});

	it('sets the accessibility label on the pressable when alt text is supported', () => {
		mockUseAltTextSupported.mockReturnValue(true);
		const { getByRole } = renderImageContainer({
			msg: 'A wavy orange and black pattern'
		});

		const button = getByRole('imagebutton');

		expect(button.props.accessibilityLabel).toBe('A wavy orange and black pattern');
		expect(button.props.accessibilityRole).toBe('imagebutton');
	});

	it('falls back to the generic accessibility label when alt text is not supported and a caption is present', () => {
		mockUseAltTextSupported.mockReturnValue(false);
		const { getByRole } = renderImageContainer({ msg: 'A wavy orange and black pattern' });

		const button = getByRole('imagebutton');

		expect(button.props.accessibilityLabel).toBe('Image without description');
		expect(button.props.accessibilityRole).toBe('imagebutton');
	});

	it('falls back to a generic accessibility label when no description or caption is present', () => {
		mockUseAltTextSupported.mockReturnValue(true);
		const { getByRole } = renderImageContainer();

		const button = getByRole('imagebutton');

		expect(button.props.accessibilityLabel).toBe('Image without description');
		expect(button.props.accessibilityRole).toBe('imagebutton');
	});
});
