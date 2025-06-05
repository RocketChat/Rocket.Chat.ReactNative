# Storybook v9 Upgrade and Snapshot Testing

This document outlines the Storybook upgrade from v7.6 to v9.0.6 and the new snapshot testing functionality.

## 🎉 What's New

### Storybook v9.0.6 Features
- **Unified release schedule** with web Storybook
- **Brand new mobile UI** optimized for mobile devices
- **New widescreen layout** for tablet/desktop
- **Simplified Metro config** with `withStorybook` wrapper
- **Improved hot-reloading** for story files
- **Component testing** with interactions, accessibility, and visual testing
- **48% lighter bundle** size
- **Tags-based organization**
- **Story globals** support

### New Snapshot Testing
- **Automated snapshot generation** from Storybook stories
- **Provider setup** with Redux store and context
- **Jest integration** with separate test projects
- **Easy script commands** for running and updating snapshots

## 📦 Dependencies Added/Updated

### Updated to v9.0.6
- `@storybook/react-native`
- `@storybook/react`
- `@storybook/addon-ondevice-controls`
- `@storybook/addon-ondevice-actions`
- `@storybook/addon-ondevice-backgrounds`
- `@storybook/addon-ondevice-notes`
- `@storybook/test`

### New Dependencies
- `@gorhom/bottom-sheet: ^5.0.1` (for v9 UI)
- `glob: ^10.3.10` (for snapshot generation)

### Required Dependencies (already present)
- `react-native-reanimated: ^3.17.1`
- `react-native-gesture-handler: ^2.24.0`
- `react-native-svg: ^15.11.2`

## 🔧 Configuration Changes

### Metro Configuration
Updated `metro.config.js` to use the new `withStorybook` wrapper:

```javascript
const withStorybook = require('@storybook/react-native/metro/withStorybook');

const baseConfig = wrapWithReanimatedMetroConfig(mergeConfig(getDefaultConfig(__dirname), config));

module.exports = withStorybook(baseConfig, {
	enabled: true,
	configPath: path.resolve(__dirname, './.storybook')
});
```

### Storybook Main Configuration
Updated `.storybook/main.ts` to include all on-device addons:

```typescript
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
```

### Jest Configuration
Added project-based configuration for snapshot testing:

```javascript
projects: [
  {
    displayName: 'app',
    testMatch: ['<rootDir>/app/**/*.test.{js,jsx,ts,tsx}']
  },
  {
    displayName: 'storybook-snapshots',
    testMatch: ['<rootDir>/.storybook/snapshots/**/*.test.{js,jsx,ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/.storybook/test-setup.tsx']
  }
]
```

## 📸 Snapshot Testing

### How It Works
1. **Story Discovery**: Automatically finds all `*.stories.tsx` files
2. **Test Generation**: Creates snapshot tests for each story variant
3. **Provider Setup**: Wraps components with Redux store and necessary context
4. **Snapshot Comparison**: Uses Jest snapshots for visual regression testing

### Available Scripts

```bash
# Generate snapshot test files from stories
yarn storybook:generate-snapshots

# Run all snapshot tests
yarn test-snapshots

# Update snapshots (when UI changes are intentional)
yarn test-snapshots-update

# Generate Storybook story index
yarn storybook:generate

# Start Storybook in React Native
yarn storybook:start
```

### Generated Test Structure
For each `Component.stories.tsx`, a corresponding `Component.snapshots.test.tsx` is created:

```typescript
import React from 'react';
import { composeStories } from '@storybook/react';
import { renderWithProviders } from '../test-setup';
import * as stories from './Component.stories';

const composedStories = composeStories(stories);

describe('Component Snapshots', () => {
  Object.keys(composedStories).forEach(storyName => {
    it('should render ' + storyName + ' correctly', () => {
      const Story = composedStories[storyName];
      const tree = renderWithProviders(Story);
      expect(tree).toMatchSnapshot();
    });
  });
});
```

### Test Setup
The `.storybook/test-setup.tsx` provides:
- Redux Provider with mocked store
- GestureHandlerRootView for gesture support
- MessageContext for component-specific context
- Proper theming and user context

## 🏃‍♂️ Getting Started

### Running Storybook
```bash
# Start the React Native development server with Storybook
yarn storybook:start

# In another terminal, run your app (iOS/Android)
yarn ios
# or
yarn android
```

### Creating Stories
Stories should follow the CSF3 format:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta = {
  component: MyComponent,
} satisfies Meta<typeof MyComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Hello World',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    ...Default.args,
    variant: 'secondary',
  },
};
```

### Generating and Running Snapshots
```bash
# 1. Generate snapshot tests from existing stories
yarn storybook:generate-snapshots

# 2. Run the snapshot tests
yarn test-snapshots

# 3. If UI changes are intentional, update snapshots
yarn test-snapshots-update
```

## 🔍 Testing Workflow

1. **Develop Components** in isolation using Storybook
2. **Create Stories** for different component states
3. **Generate Snapshots** to catch visual regressions
4. **Review Changes** when snapshots fail
5. **Update Snapshots** when changes are intentional

## 🛠 Troubleshooting

### Common Issues

#### Metro bundler issues
- Clear Metro cache: `yarn start --reset-cache`
- Delete `node_modules` and reinstall: `rm -rf node_modules && yarn install`

#### Snapshot test failures
- Review the failing snapshots in the diff
- If changes are intentional: `yarn test-snapshots-update`
- If not, check your component changes

#### Missing dependencies
Ensure all required dependencies are installed:
```bash
yarn install
```

### Babel Configuration
Make sure your `babel.config.js` includes:
```javascript
plugins: [
  'react-native-reanimated/plugin',
  // ... other plugins
]
```

## 📚 Additional Resources

- [Storybook React Native Documentation](https://storybook.js.org/docs/react-native/get-started/introduction)
- [Storybook v9 Release Notes](https://storybook.js.org/releases)
- [Portable Stories Documentation](https://storybook.js.org/docs/api/portable-stories)
- [Jest Snapshot Testing](https://jestjs.io/docs/snapshot-testing)

## 🔄 Migration Notes

This upgrade maintains backward compatibility with existing stories. However, you can now take advantage of:

- Better TypeScript support with CSF3
- Improved performance with the new UI
- Enhanced testing capabilities with portable stories
- Automated snapshot generation for regression testing

The snapshot testing system provides an excellent way to catch unintended visual changes and ensure component consistency across the application.