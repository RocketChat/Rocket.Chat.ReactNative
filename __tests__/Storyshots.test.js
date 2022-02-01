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

const converter = new Stories2SnapsConverter();

// Runner
initStoryshots({
	asyncJest: true,
	test: ({ story, context, done }) => {
		const snapshotFilename = converter.getSnapshotFileName(context);
		const storyElement = story.render();
		const { update, toJSON } = render(storyElement);
		update(storyElement);
		setTimeout(() => {
			const json = toJSON();
			expect(JSON.stringify(json)).toMatchSpecificSnapshot(snapshotFilename);
			done();
		}, 10);
	}
});
