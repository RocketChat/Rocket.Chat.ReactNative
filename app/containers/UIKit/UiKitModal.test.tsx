import { generateSnapshots } from '~/.rnstorybook/generateSnapshots';
import * as stories from './UiKitModal.stories';

jest.mock('~/lib/methods/handleMediaDownload.ts', () => ({
	...jest.requireActual('~/lib/methods/handleMediaDownload.ts'),
	getMediaCache: jest.fn(() => Promise.resolve({ exists: false })),
	downloadMediaFile: jest.fn(() => Promise.resolve('')),
	isDownloadActive: jest.fn(() => false)
}));

generateSnapshots(stories);
