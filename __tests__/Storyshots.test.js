import initStoryshots from '@storybook/addon-storyshots';

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

jest.mock('../app/lib/database', () => jest.fn(() => null));
global.Date.now = jest.fn(() => new Date('2019-10-10').getTime());

initStoryshots();
