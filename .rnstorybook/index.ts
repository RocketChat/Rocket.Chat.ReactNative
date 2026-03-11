import AsyncStorage from '@react-native-async-storage/async-storage';
import { view } from './storybook.requires';
import RNBootSplash from 'react-native-bootsplash';
import { Linking } from 'react-native';

const StorybookUIRoot = view.getStorybookUI({
	storage: {
		getItem: AsyncStorage.getItem,
		setItem: AsyncStorage.setItem
	}
});

function openStoryFromUrl(url: string | null) {
	if (!url) return

	try {
		const parsed = new URL(url)
		const path = parsed.searchParams.get('path')

		if (!path) return

		const storyId = path.replace('/story/', '')

		const channel = view._channel

		const emit = () => {
			channel.emit('setCurrentStory', { storyId })
		}

		if (channel) {
			emit()
		} else {
			setTimeout(emit, 500)
		}
	} catch (e) {
		console.log(e)
	}
}

Linking.getInitialURL().then(openStoryFromUrl);

Linking.addEventListener('url', event => {
	openStoryFromUrl(event.url)
});

RNBootSplash.hide();

export default StorybookUIRoot;
