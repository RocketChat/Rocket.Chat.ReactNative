import React from 'react';
import { View } from 'react-native';

import { WidthAwareContext } from '../../WidthAwareView';
import { MessageImage } from './Image';

const MOCK_URI = 'https://picsum.photos/400/300';

export default {
	title: 'Attachments/MessageImage'
};

export const Default = () => (
	<View style={{ padding: 10 }}>
		<WidthAwareContext.Provider value={350}>
			<MessageImage uri={MOCK_URI} status='downloaded' encrypted={false} />
		</WidthAwareContext.Provider>
	</View>
);

export const Loading = () => (
	<View style={{ padding: 10 }}>
		<WidthAwareContext.Provider value={350}>
			<MessageImage uri={MOCK_URI} status='loading' encrypted={false} />
		</WidthAwareContext.Provider>
	</View>
);

export const GIF = () => (
	<View style={{ padding: 10 }}>
		<WidthAwareContext.Provider value={350}>
			<MessageImage uri={MOCK_URI} status='downloaded' encrypted={false} imageType='image/gif' />
		</WidthAwareContext.Provider>
	</View>
);

// server < 8.4: description is shown as a caption (not as alt text on MessageImage)
export const WithAltTextOldServer = () => (
	<View style={{ padding: 10 }}>
		<WidthAwareContext.Provider value={350}>
			<MessageImage uri={MOCK_URI} status='downloaded' encrypted={false} />
		</WidthAwareContext.Provider>
	</View>
);

// server >= 8.4: altText applied as accessibilityLabel to the image
export const WithAltTextNewServer = () => (
	<View style={{ padding: 10 }}>
		<WidthAwareContext.Provider value={350}>
			<MessageImage uri={MOCK_URI} status='downloaded' encrypted={false} />
		</WidthAwareContext.Provider>
	</View>
);
