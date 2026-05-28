import { render, waitFor } from '@testing-library/react-native';
import { Image as ExpoImage } from 'expo-image';

import { WidthAwareContext } from '../../WidthAwareView';
import { MessageImage } from './Image';

jest.mock('../../../../../lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn(() => [true, jest.fn()])
}));

const renderMessageImage = () =>
	render(
		<WidthAwareContext.Provider value={200}>
			<MessageImage uri='https://open.rocket.chat/image.png' status='downloaded' encrypted={false} />
		</WidthAwareContext.Provider>
	);

describe('MessageImage', () => {
	it('does not set accessibility props on the nested image', async () => {
		const { UNSAFE_getByType } = renderMessageImage();

		await waitFor(() => {
			const image = UNSAFE_getByType(ExpoImage);

			expect(image.props.accessibilityLabel).toBeUndefined();
			expect(image.props.accessible).toBeUndefined();
		});
	});
});
