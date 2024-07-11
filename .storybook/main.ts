import { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
  stories: ['../app/**/*.stories.?(ts|tsx|js|jsx)'],
  addons: [],
};

export default main;
