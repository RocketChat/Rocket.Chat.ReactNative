import { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
  stories: ['../app/**/*.stories.?(ts|tsx|js|jsx)'],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
    '@storybook/addon-ondevice-backgrounds',
    '@storybook/addon-ondevice-notes',
  ],
};

export default main;
