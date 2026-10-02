import { act, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import axios from 'axios';

import { createMockedStore } from '~/reducers/mockedStore';
import { updateSettings } from '~/actions/settings';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { type IUrl, type TAnyMessageModel } from '~/definitions';
import { MessageRoomProvider } from '~/containers/message/stores/MessageRoomStore';
import { MessageProvider } from '~/containers/message/stores/MessageStore';
import { WidthAwareContext } from '../WidthAwareView';
import Urls from '../Urls';

jest.mock('axios', () => ({ head: jest.fn() }));

const mockedHead = axios.head as jest.Mock;

const store = createMockedStore();
store.dispatch(updateSettings('API_Embed', true));
store.dispatch(setUser({ id: 'reader-id', username: 'reader', token: 'token' }));
store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version: '', name: '' }));

const renderUrl = (url: Partial<IUrl>, measuredWidth = 300) => {
	const item = {
		id: 'msg-id',
		msg: '',
		u: { _id: 'author-id', username: 'rocket.cat' },
		urls: [{ title: 'Pull request', description: 'Description', ...url }]
	} as unknown as TAnyMessageModel;

	return render(
		<Provider store={store}>
			<MessageRoomProvider>
				<MessageProvider item={item}>
					<WidthAwareContext.Provider value={measuredWidth}>
						<Urls />
					</WidthAwareContext.Provider>
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
};

const getImageStyle = () => StyleSheet.flatten(screen.UNSAFE_getByType(ExpoImage).props.style);

describe('Urls', () => {
	beforeEach(() => {
		mockedHead.mockReset();
		mockedHead.mockResolvedValue({ headers: { 'content-type': 'text/html' } });
	});

	it('sizes the preview image from metadata dimensions on first render', () => {
		renderUrl({
			url: 'https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7707',
			image: 'https://opengraph.githubassets.com/pr.png',
			imageWidth: 1200,
			imageHeight: 600
		});

		expect(getImageStyle()).toMatchObject({ width: '100%', maxWidth: 1200, aspectRatio: 2, maxHeight: 300 });
		expect(mockedHead).not.toHaveBeenCalled();
	});

	it('bounds the height of a tall preview image before the width is measured', () => {
		renderUrl(
			{
				url: 'https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7707',
				image: 'https://opengraph.githubassets.com/tall.png',
				imageWidth: 600,
				imageHeight: 1200
			},
			0
		);

		expect(getImageStyle()).toMatchObject({ width: '100%', maxWidth: 600, aspectRatio: 1 });
	});

	it('reserves no image space when the url has no preview image', async () => {
		renderUrl({ url: 'https://rocket.chat', image: '' });
		await act(() => Promise.resolve());

		expect(mockedHead).toHaveBeenCalledWith('https://rocket.chat');
		expect(screen.UNSAFE_queryByType(ExpoImage)).toBeNull();
		expect(screen.getByText('Pull request')).toBeOnTheScreen();
	});

	it('shows a bare link as an image once the server reports an image content type', async () => {
		mockedHead.mockResolvedValue({ headers: { 'content-type': 'image/png' } });
		renderUrl({ url: 'https://example.com/photo.png', image: '' });
		await act(() => Promise.resolve());

		expect(screen.UNSAFE_getByType(ExpoImage).props.source).toEqual({ uri: 'https://example.com/photo.png' });
	});

	it('sizes the preview image from the loaded image when metadata has no dimensions', () => {
		renderUrl({ url: 'https://rocket.chat', image: 'https://rocket.chat/og.png' });

		act(() => {
			screen.UNSAFE_getByType(ExpoImage).props.onLoad({ source: { width: 800, height: 400 } });
		});

		expect(getImageStyle()).toMatchObject({ maxWidth: 800, aspectRatio: 2 });
	});

	it('removes the reserved image space when the image fails to load', () => {
		renderUrl({
			url: 'https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7707',
			image: 'https://opengraph.githubassets.com/broken.png',
			imageWidth: 1200,
			imageHeight: 600
		});

		act(() => {
			screen.UNSAFE_getByType(ExpoImage).props.onError({ error: 'failed' });
		});

		expect(screen.UNSAFE_queryByType(ExpoImage)).toBeNull();
		expect(screen.getByText('Pull request')).toBeOnTheScreen();
	});
});
