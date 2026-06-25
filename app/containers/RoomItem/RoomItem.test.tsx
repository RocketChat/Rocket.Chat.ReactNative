import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import * as stories from './RoomItem.stories';

jest.unmock('../../lib/hooks/useResponsiveLayout/useResponsiveLayout');

generateSnapshots(stories);
