import initStoryshots, { Stories2SnapsConverter } from '@storybook/addon-storyshots';
import { render } from '@testing-library/react-native';

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

jest.mock('react-native-mmkv-storage', () => {
	return {
		Loader: jest.fn().mockImplementation(() => {
			return {
				setProcessingMode: jest.fn().mockImplementation(() => {
					return {
						withEncryption: jest.fn().mockImplementation(() => {
							return {
								initialize: jest.fn()
							};
						})
					};
				})
			};
		}),
		create: jest.fn(),
		MODES: { MULTI_PROCESS: '' }
	};
});

const converter = new Stories2SnapsConverter();

initStoryshots({
	test: ({ story, context }) => {
		const snapshotFilename = converter.getSnapshotFileName(context);
		const storyElement = story.render();
		const { update, toJSON } = render(storyElement);
		update(storyElement);
		const json = toJSON();
		expect(JSON.stringify(json)).toMatchSpecificSnapshot(snapshotFilename);
	}
});
