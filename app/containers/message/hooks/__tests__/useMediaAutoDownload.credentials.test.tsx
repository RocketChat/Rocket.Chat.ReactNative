import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-native';

import { useMediaAutoDownload } from '../useMediaAutoDownload';
import { MessageProvider } from '~/containers/message/stores/MessageStore';
import { MessageRoomProvider } from '~/containers/message/stores/MessageRoomStore';
import { mockedStore } from '~/reducers/mockedStore';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { type IAttachment, type TAnyMessageModel } from '~/definitions';
import { store } from '~/lib/store/auxStore';

// Real formatAttachmentUrl on purpose: this guards the credential leak end to end through the hook.
jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: jest.fn() }
}));

jest.mock('~/lib/methods/handleMediaDownload', () => ({
	downloadMediaFile: jest.fn(),
	getMediaCache: jest.fn().mockResolvedValue({ exists: false }),
	isDownloadActive: jest.fn().mockReturnValue(false),
	cancelDownload: jest.fn()
}));

jest.mock('~/lib/methods/autoDownloadPreference', () => ({
	fetchAutoDownloadEnabled: jest.fn().mockReturnValue(false)
}));

const SERVER = 'https://mobile.qa.rocket.chat';
const REAL_IMG = `${SERVER}/file-upload/abc/photo.png`;

mockedStore.dispatch(setUser({ id: 'user-1', username: 'john', token: 'secret-token' }));
mockedStore.dispatch(selectServerSuccess({ server: SERVER, version: '', name: '' }));

const getUrl = (file: IAttachment) => {
	const item = { id: 'msg-1' } as unknown as TAnyMessageModel;
	const wrapper = ({ children }: { children: ReactNode }) => (
		<Provider store={mockedStore}>
			<MessageRoomProvider>
				<MessageProvider item={item}>{children}</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
	return renderHook(() => useMediaAutoDownload({ file }), { wrapper }).result.current.url as string;
};

describe('useMediaAutoDownload credentials', () => {
	beforeEach(() => {
		(store.getState as jest.Mock).mockReturnValue({ settings: { FileUpload_ProtectFiles: true } });
	});

	it('adds credentials to a file hosted on the workspace', () => {
		expect(getUrl({ title_link: '/file-upload/abc/photo.png', image_url: REAL_IMG })).toBe(
			`${SERVER}/file-upload/abc/photo.png?rc_token=secret-token&rc_uid=user-1`
		);
	});

	it.each([
		['plain image_url on attacker host', { image_url: 'https://evil.example/pixel.jpg' }],
		[
			'title_link on attacker host, image_url on the real server',
			{ title_link: 'https://evil.example/x.jpg', image_url: REAL_IMG }
		],
		[
			'title_link on attacker host, image_url on a look-alike host',
			{ title_link: 'https://evil.example/x.jpg', image_url: 'https://mobile.qa.rocket.chat.evil.example/x.png' }
		],
		[
			'title_link on attacker host, image_url with userinfo',
			{ title_link: 'https://evil.example/x.jpg', image_url: 'https://mobile.qa.rocket.chat@evil.example/x.png' }
		],
		['title_link on attacker host, no image_url', { title_link: 'https://evil.example/x.jpg', image_type: 'image/png' }],
		['video title_link on attacker host', { title_link: 'https://evil.example/v.mp4', video_url: REAL_IMG }],
		['audio title_link on attacker host', { title_link: 'https://evil.example/a.mp3', audio_url: REAL_IMG }]
	] as [string, IAttachment][])('does not send credentials for %s', (_name, file) => {
		const url = getUrl(file);
		expect(url).not.toContain('secret-token');
		expect(url).not.toContain('rc_token');
		expect(url).not.toContain('rc_uid');
	});
});
