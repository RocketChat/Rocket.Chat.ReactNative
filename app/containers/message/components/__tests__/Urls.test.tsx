import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react-native';
import axios from 'axios';

import Urls from '../Urls';
import { MessageProvider } from '~/containers/message/stores/MessageStore';
import { MessageRoomProvider } from '~/containers/message/stores/MessageRoomStore';
import { mockedStore } from '~/reducers/mockedStore';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { addSettings } from '~/actions/settings';
import { type TAnyMessageModel } from '~/definitions';
import { store } from '~/lib/store/auxStore';

jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: jest.fn() }
}));

jest.mock('axios', () => ({
	__esModule: true,
	default: { head: jest.fn() }
}));

jest.mock('expo-image', () => {
	const { View } = require('react-native');
	const Image = () => <View />;
	Image.loadAsync = jest.fn();
	return { Image };
});

const SERVER = 'https://mobile.qa.rocket.chat';
const mockHead = axios.head as jest.Mock;

mockedStore.dispatch(setUser({ id: 'user-1', username: 'john', token: 'secret-token' }));
mockedStore.dispatch(selectServerSuccess({ server: SERVER, version: '', name: '' }));
mockedStore.dispatch(addSettings({ API_Embed: true }));

const renderUrls = (urlImage: string) => {
	const item = { id: 'msg-1', urls: [{ url: 'https://example.com/page', image: urlImage }] } as unknown as TAnyMessageModel;
	return render(
		<Provider store={mockedStore}>
			<MessageRoomProvider>
				<MessageProvider item={item}>
					<Urls />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
};

describe('Urls image preview credentials', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(store.getState as jest.Mock).mockReturnValue({ settings: { FileUpload_ProtectFiles: true } });
		mockHead.mockResolvedValue({ headers: { 'content-type': 'image/png' } });
	});

	it('adds credentials to a relative preview image on the workspace', async () => {
		renderUrls('file-upload/1/preview.png');
		await waitFor(() => expect(mockHead).toHaveBeenCalled());
		expect(mockHead).toHaveBeenCalledWith(`${SERVER}/file-upload/1/preview.png?rc_token=secret-token&rc_uid=user-1`);
	});

	it.each(['@evil.example/x.png', '.evil.example/x.png', '//evil.example/x.png'])(
		'keeps host-like relative image %s on the workspace origin',
		async image => {
			renderUrls(image);
			await waitFor(() => expect(mockHead).toHaveBeenCalled());
			expect(new URL(mockHead.mock.calls[0][0]).origin).toBe(SERVER);
		}
	);

	it('requests an absolute third-party preview image without credentials', async () => {
		renderUrls('https://evil.example/x.png');
		await waitFor(() => expect(mockHead).toHaveBeenCalled());
		expect(mockHead).toHaveBeenCalledWith('https://evil.example/x.png');
	});
});
