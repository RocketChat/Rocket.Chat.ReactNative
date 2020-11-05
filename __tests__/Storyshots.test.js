import initStoryshots from '@storybook/addon-storyshots';

jest.mock('../app/lib/database', () => jest.fn(() => null));
global.Date.now = jest.fn(() => new Date('2019-10-10').getTime());

initStoryshots();
