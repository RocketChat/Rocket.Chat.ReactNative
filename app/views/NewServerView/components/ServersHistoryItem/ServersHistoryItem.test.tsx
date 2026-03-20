import { generateSnapshots } from '../../../../../.rnstorybook/generateSnapshots';
import * as stories from './ServersHistoryItem.stories';

jest.unmock('../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout');

generateSnapshots(stories);
