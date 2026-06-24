import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import * as stories from './RoomHeader.stories';

jest.useFakeTimers();
jest.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

generateSnapshots(stories);
