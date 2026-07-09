import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import * as stories from './Markdown.stories';

beforeAll(() => {
	jest.useFakeTimers({ now: new Date('2026-02-01T00:00:00.000Z').getTime() });
});

generateSnapshots(stories);
