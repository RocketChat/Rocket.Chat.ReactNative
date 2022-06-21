import mockClipboard from '@react-native-clipboard/clipboard/jest/clipboard-mock.js';
import mockAsyncStorage from '@react-native-community/async-storage/jest/async-storage-mock';

jest.mock('@react-native-community/async-storage', () => mockAsyncStorage);

require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();

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

jest.mock('expo-haptics', () => jest.fn(() => null));

jest.mock('./app/lib/database', () => jest.fn(() => null));

const mockedNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => mockedNavigate
}));

jest.mock('react-native-notifications', () => ({
	Notifications: {
		getInitialNotification: jest.fn(() => Promise.resolve()),
		registerRemoteNotifications: jest.fn(),
		events: () => ({
			registerRemoteNotificationsRegistered: jest.fn(),
			registerRemoteNotificationsRegistrationFailed: jest.fn(),
			registerNotificationReceivedForeground: jest.fn(),
			registerNotificationReceivedBackground: jest.fn(),
			registerNotificationOpened: jest.fn()
		})
	}
}));
