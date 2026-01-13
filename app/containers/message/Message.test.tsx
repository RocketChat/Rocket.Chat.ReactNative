import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import * as stories from './Message.stories';

jest.mock('../../lib/methods/handleMediaDownload.ts', () => ({
	downloadMediaFile: jest.fn(),
	getMediaCache: jest.fn(),
	isDownloadActive: jest.fn()
}));

jest.unmock('../../lib/hooks/useResponsiveLayout/useResponsiveLayout');

generateSnapshots(stories);
