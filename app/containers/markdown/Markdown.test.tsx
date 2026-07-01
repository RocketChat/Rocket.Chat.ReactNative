import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import * as stories from './Markdown.stories';

jest.useFakeTimers({ now: new Date('2026-01-01T12:00:00Z').getTime() });

generateSnapshots(stories);
