import { generateSnapshots } from '../../../../.rnstorybook/generateSnapshots';
import * as stories from './LoadMore.stories';

jest.unmock('../../../lib/hooks/useResponsiveLayout/useResponsiveLayout');

generateSnapshots(stories);
