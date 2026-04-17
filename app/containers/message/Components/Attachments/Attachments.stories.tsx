import React from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';

import { createMockedStore } from '../../../../reducers/mockedStore';
import { selectServerSuccess } from '../../../../actions/server';
import MessageContext from '../../Context';
import Attachments from './Attachments';

const mockMessageContext = {
	id: 'msg-id',
	baseUrl: 'https://open.rocket.chat',
	user: { id: 'user-id', username: 'rocket.cat', token: 'token' },
	onLongPress: () => {},
	translateLanguage: undefined
};

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

const MOCK_IMAGES_GALLERY = [
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
	<Provider store={oldServerStore}>
		<MessageContext.Provider value={mockMessageContext}>
			<View style={{ padding: 10, width: 350 }}>
				<Attachments attachments={[MOCK_IMAGE_WITH_ALT]} getCustomEmoji={() => null} timeFormat='LT' />
			</View>
		</MessageContext.Provider>
	</Provider>
);

// Single image on server >= 8.4: renders with AltTextLabel pill below image
export const SingleImageNewServer = () => (
	<Provider store={newServerStore}>
		<MessageContext.Provider value={mockMessageContext}>
			<View style={{ padding: 10, width: 350 }}>
				<Attachments attachments={[MOCK_IMAGE_WITH_ALT]} getCustomEmoji={() => null} timeFormat='LT' />
			</View>
		</MessageContext.Provider>
	</Provider>
);

// Single image without alt text on new server: no label
export const SingleImageNoAlt = () => (
	<Provider store={newServerStore}>
		<MessageContext.Provider value={mockMessageContext}>
			<View style={{ padding: 10, width: 350 }}>
				<Attachments attachments={[MOCK_IMAGE_1]} getCustomEmoji={() => null} timeFormat='LT' />
			</View>
		</MessageContext.Provider>
	</Provider>
);

// 5 images on server >= 8.4: renders as 2×2 gallery with +1 overflow on 4th cell
export const MultipleImagesGallery = () => (
	<Provider store={newServerStore}>
		<MessageContext.Provider value={mockMessageContext}>
			<View style={{ padding: 10, width: 350 }}>
				<Attachments attachments={MOCK_IMAGES_GALLERY} getCustomEmoji={() => null} timeFormat='LT' />
			</View>
		</MessageContext.Provider>
	</Provider>
);

// 4 images on server < 8.4: renders stacked (existing behavior)
export const MultipleImagesOldServer = () => (
	<Provider store={oldServerStore}>
		<MessageContext.Provider value={mockMessageContext}>
			<View style={{ padding: 10, width: 350 }}>
				<Attachments attachments={MOCK_IMAGES_GALLERY.slice(0, 4)} getCustomEmoji={() => null} timeFormat='LT' />
			</View>
		</MessageContext.Provider>
	</Provider>
);
