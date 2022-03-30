import mockClipboard from '@react-native-clipboard/clipboard/jest/clipboard-mock.js';

jest.mock('@react-native-clipboard/clipboard', () => mockClipboard);

jest.mock('react-native-mmkv-storage', () => ({
	Loader: jest.fn().mockImplementation(() => ({
		setProcessingMode: jest.fn().mockImplementation(() => ({
			withEncryption: jest.fn().mockImplementation(() => ({
				initialize: jest.fn()
			}))
		}))
	})),
	create: jest.fn(),
	MODES: { MULTI_PROCESS: '' }
}));

jest.mock('rn-fetch-blob', () => ({
	fs: {
		dirs: {
			DocumentDir: '/data/com.rocket.chat/documents',
			DownloadDir: '/data/com.rocket.chat/downloads'
		},
		exists: jest.fn(() => null)
	},
	fetch: jest.fn(() => null),
	config: jest.fn(() => null)
}));

jest.mock('react-native-file-viewer', () => ({
	open: jest.fn(() => null)
}));

jest.mock('./app/lib/database', () => jest.fn(() => null));
