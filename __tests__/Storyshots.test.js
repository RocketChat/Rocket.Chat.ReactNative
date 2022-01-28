import initStoryshots from '@storybook/addon-storyshots';
import React from 'react';
import { act, create } from 'react-test-renderer';

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

initStoryshots({
	asyncJest: true,
	test: async ({ story, done }) => {
		let renderer;
		try {
			act(() => {
				renderer = create(React.createElement(story.render));
			});
			await act(() => new Promise(resolve => setTimeout(resolve, 0)));
			expect(renderer).toMatchSnapshot();
			renderer.unmount();
			done();
		} finally {
		}
	}
});
