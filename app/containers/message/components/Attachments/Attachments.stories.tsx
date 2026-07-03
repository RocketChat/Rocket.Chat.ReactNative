import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { selectServerSuccess } from '../../../../actions/server';
import { type TAnyMessageModel } from '../../../../definitions';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { MessageProvider } from '../../stores/MessageStore';
import Attachments from './Attachments';

const mockMessageContext: Partial<MessageRoomState> = {
	baseUrl: 'https://open.rocket.chat',
	user: { id: 'user-id', username: 'rocket.cat', token: 'token' },
	getCustomEmoji: () => null,
	showAttachment: undefined
};

const mockItem = { id: 'msg-id', msg: '', u: { username: 'rocket.cat' }, autoTranslate: false } as unknown as TAnyMessageModel;

const StoryWrapper = ({ store, children }: { store: any; children: ReactNode }) => (
	<Provider store={store}>
		<MessageRoomProvider {...mockMessageContext}>
			<MessageProvider item={mockItem}>{children}</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

const MOCK_IMAGE_1 = {
	image_url: 'https://picsum.photos/seed/1/400/300',
	image_type: 'image/jpeg',
	image_preview: ''
};

const MOCK_IMAGE_WITH_ALT = {
	image_url: 'https://picsum.photos/seed/2/400/300',
	image_type: 'image/jpeg',
	image_preview: '',
	description: 'A wavy orange and black pattern, designed to be used as a wallpaper'
};

const MOCK_MULTIPLE_IMAGES = [
	{ image_url: 'https://picsum.photos/seed/3/400/300', image_type: 'image/jpeg', image_preview: '', description: 'Image 1' },
	{ image_url: 'https://picsum.photos/seed/4/400/300', image_type: 'image/jpeg', image_preview: '', description: 'Image 2' },
	{ image_url: 'https://picsum.photos/seed/5/400/300', image_type: 'image/jpeg', image_preview: '', description: 'Image 3' },
	{ image_url: 'https://picsum.photos/seed/6/400/300', image_type: 'image/jpeg', image_preview: '', description: 'Image 4' },
	{ image_url: 'https://picsum.photos/seed/7/400/300', image_type: 'image/jpeg', image_preview: '', description: 'Image 5' }
];

// Set server version in the store for server-aware stories
const createServerStore = (version: string) => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version, name: 'Test' }));
	return store;
};

const oldServerStore = createServerStore('8.3.0');
const newServerStore = createServerStore('8.5.0');

export default {
	title: 'Attachments/Attachments'
};

// Single image on server < 8.4: renders with Markdown caption if description is set
export const SingleImageOldServer = () => (
	<StoryWrapper store={oldServerStore}>
		<View style={{ padding: 10, width: 350 }}>
			<Attachments attachments={[MOCK_IMAGE_WITH_ALT]} />
		</View>
	</StoryWrapper>
);

// Single image on server >= 8.4: renders with AltTextLabel pill below image
export const SingleImageNewServer = () => (
	<StoryWrapper store={newServerStore}>
		<View style={{ padding: 10, width: 350 }}>
			<Attachments attachments={[MOCK_IMAGE_WITH_ALT]} />
		</View>
	</StoryWrapper>
);

// Single image without alt text on new server: no label
export const SingleImageNoAlt = () => (
	<StoryWrapper store={newServerStore}>
		<View style={{ padding: 10, width: 350 }}>
			<Attachments attachments={[MOCK_IMAGE_1]} />
		</View>
	</StoryWrapper>
);

// Multiple images on server >= 8.4: each attachment renders as its own image row
export const MultipleImagesNewServer = () => (
	<StoryWrapper store={newServerStore}>
		<View style={{ padding: 10, width: 350 }}>
			<Attachments attachments={MOCK_MULTIPLE_IMAGES} />
		</View>
	</StoryWrapper>
);

// 4 images on server < 8.4: renders stacked (existing behavior)
export const MultipleImagesOldServer = () => (
	<StoryWrapper store={oldServerStore}>
		<View style={{ padding: 10, width: 350 }}>
			<Attachments attachments={MOCK_MULTIPLE_IMAGES.slice(0, 4)} />
		</View>
	</StoryWrapper>
);
