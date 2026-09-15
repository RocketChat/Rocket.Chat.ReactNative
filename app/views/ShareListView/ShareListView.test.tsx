jest.mock('../../lib/database', () => ({
	servers: {
		get: jest.fn(() => ({
			find: jest.fn(() => Promise.resolve({}))
		}))
	},
	active: {
		get: jest.fn()
	}
}));

jest.mock('../../lib/methods/helpers/showToast', () => ({
	showToast: jest.fn()
}));

jest.mock('expo-file-system/legacy', () => ({
	getInfoAsync: jest.fn(),
	readAsStringAsync: jest.fn(),
	EncodingType: { Base64: 'base64', UTF8: 'utf8' }
}));

const { showToast } = require('../../lib/methods/helpers/showToast');
const ExpoFileSystem = require('expo-file-system/legacy') as { getInfoAsync: jest.Mock; readAsStringAsync: jest.Mock };
const { ShareListView } = require('./index');

const makeInstance = ({ mediaUris, attachments }: { mediaUris?: string; attachments: any[] }) => {
	const shareListView = new ShareListView({
		navigation: {
			addListener: jest.fn(() => jest.fn()),
			setOptions: jest.fn(),
			navigate: jest.fn()
		} as any,
		shareExtensionParams: { text: undefined, mediaUris },
		dispatch: jest.fn(),
		theme: 'light',
		insets: { top: 0, bottom: 0, left: 0, right: 0 }
	} as any);

	shareListView.state = {
		...shareListView.state,
		attachments,
		serverInfo: {} as any
	};

	return shareListView;
};

describe('ShareListView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows a toast and does not navigate when a media share ends up with no valid attachments', () => {
		const shareListView = makeInstance({ mediaUris: 'file:///missing.jpg', attachments: [] });
		const { navigation } = shareListView.props as any;

		shareListView.shareMessage({ rid: 'room-id' } as any);

		expect(showToast).toHaveBeenCalledTimes(1);
		expect(navigation.navigate).not.toHaveBeenCalled();
	});

	it('navigates normally when at least one valid attachment remains', () => {
		const shareListView = makeInstance({
			mediaUris: 'file:///valid.jpg,file:///missing.jpg',
			attachments: [{ filename: 'valid.jpg', path: '/tmp/valid.jpg', size: 1, mime: 'image/jpeg' }]
		});
		const { navigation } = shareListView.props as any;

		shareListView.shareMessage({ rid: 'room-id' } as any);

		expect(showToast).not.toHaveBeenCalled();
		expect(navigation.navigate).toHaveBeenCalledTimes(1);
	});

	it('navigates normally for a text-only share with no attachments', () => {
		const shareListView = makeInstance({ mediaUris: undefined, attachments: [] });
		const { navigation } = shareListView.props as any;

		shareListView.shareMessage({ rid: 'room-id' } as any);

		expect(showToast).not.toHaveBeenCalled();
		expect(navigation.navigate).toHaveBeenCalledTimes(1);
	});

	it('toasts and closes before channel select when no shared file is valid', async () => {
		ExpoFileSystem.getInfoAsync.mockResolvedValue({ exists: false, uri: 'file:///missing.jpg' });
		const shareListView = makeInstance({ mediaUris: 'file:///missing.jpg', attachments: [] });
		const { dispatch } = shareListView.props as any;

		await shareListView.componentDidMount();

		expect(showToast).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledTimes(1);
	});

	it('does not toast on mount when at least one shared file is valid', async () => {
		ExpoFileSystem.getInfoAsync.mockResolvedValue({ exists: true, uri: 'file:///valid.jpg', size: 1 });
		ExpoFileSystem.readAsStringAsync.mockResolvedValue('');
		const shareListView = makeInstance({ mediaUris: 'file:///valid.jpg', attachments: [] });
		const { dispatch } = shareListView.props as any;

		await shareListView.componentDidMount();

		expect(showToast).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('toasts and closes before channel select when the shared file exists but is not readable', async () => {
		ExpoFileSystem.getInfoAsync.mockResolvedValue({ exists: true, uri: 'file:///unreadable.jpg', size: 1 });
		ExpoFileSystem.readAsStringAsync.mockRejectedValue(new Error('Permission denied'));
		const shareListView = makeInstance({ mediaUris: 'file:///unreadable.jpg', attachments: [] });
		const { dispatch } = shareListView.props as any;

		await shareListView.componentDidMount();

		expect(showToast).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledTimes(1);
	});
});
