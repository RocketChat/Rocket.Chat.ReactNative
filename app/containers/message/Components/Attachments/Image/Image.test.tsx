import { render, waitFor } from '@testing-library/react-native';
import { Image as ExpoImage } from 'expo-image';

import { WidthAwareContext } from '../../WidthAwareView';
import { MessageImage } from './Image';

jest.mock('../../../../../lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn(() => [true, jest.fn()])
}));

const renderMessageImage = (altText?: string) =>
	render(
		<WidthAwareContext.Provider value={200}>
			<MessageImage uri='https://open.rocket.chat/image.png' status='downloaded' encrypted={false} altText={altText} />
		</WidthAwareContext.Provider>
	);

describe('MessageImage', () => {
	it('sets the accessibility label when altText is provided', async () => {
		const { UNSAFE_getByType } = renderMessageImage('A wavy orange and black pattern');

		await waitFor(() => {
			const image = UNSAFE_getByType(ExpoImage);

			expect(image.props.accessibilityLabel).toBe('A wavy orange and black pattern');
			expect(image.props.accessible).toBe(true);
		});
	});

	it('does not set the accessibility label when altText is undefined', async () => {
		const { UNSAFE_getByType } = renderMessageImage();

		await waitFor(() => {
			const image = UNSAFE_getByType(ExpoImage);

			expect(image.props.accessibilityLabel).toBeUndefined();
			expect(image.props.accessible).toBe(false);
		});
	});
});
