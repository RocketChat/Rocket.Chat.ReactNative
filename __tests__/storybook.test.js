import initStoryshots, { Stories2SnapsConverter } from '@storybook/addon-storyshots';
import { render } from '@testing-library/react-native';

global.Date.now = jest.fn(() => new Date('2019-10-10').getTime());

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
