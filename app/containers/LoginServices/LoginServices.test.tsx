import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import * as stories from './LoginServices.stories';

jest.mock('../../lib/services/connect', () => ({}));

generateSnapshots(stories);
