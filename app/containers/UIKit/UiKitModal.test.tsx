import { generateSnapshots } from '~/.rnstorybook/generateSnapshots';
import * as stories from './UiKitModal.stories';

jest.mock('~/lib/methods/handleMediaDownload.ts', () => ({
	...jest.requireActual('~/lib/methods/handleMediaDownload.ts'),
	getMediaCache: jest.fn(() => Promise.resolve({ exists: false })),
	downloadMediaFile: jest.fn(() => ({ uri: Promise.resolve(''), cancel: jest.fn(), detach: jest.fn() })),
	isDownloadActive: jest.fn(() => false)
}));

generateSnapshots(stories);
