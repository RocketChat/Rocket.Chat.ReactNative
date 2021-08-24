# Contributing Guidelines 

Great to have you here! Here are a few ways you can help make this project better!

## Setting up a development environment

Refer to [React Native environment setup](https://reactnative.dev/docs/environment-setup) to make sure everything is up and running.
Follow the `React Native CLI Quickstart` section as we don't support Expo managed flow.

*Note: you'll need a MacOS to run iOS apps*

### How to run

Clone repository and install dependencies:
```sh
git clone git@github.com:RocketChat/Rocket.Chat.ReactNative.git
cd Rocket.Chat.ReactNative
yarn
```

Run the app:
```sh
yarn ios
```

or

```sh
yarn android
```

At this point, the app should be running on the simulator or on your device!

*Note: npm won't work on this project*

### How to inspect the app

We use [Reactotron](https://github.com/infinitered/reactotron) to inspect logs, redux state, redux-sagas, HTTP requests, etc.

## Issues needing help

Didn't find a bug or want a new feature not already reported? Check out the [help wanted](https://github.com/RocketChat/Rocket.Chat.ReactNative/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%91%8B+help+wanted%22) or the [good first issue](https://github.com/RocketChat/Rocket.Chat.ReactNative/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%8D%AD+good+first+issue%22) labels.

Can't help coding? Triaging issues is a **great** way of helping.

## Code style

We use [ESLint](https://eslint.org/) to enforce code style and best practices. We have a pre-commit hook enforcing commits to follow our lint rules.

To check for lint issues on your code, run this on your terminal:

```sh
yarn lint
```

## Tests

It's always important to ensure everything is working properly and that's why tests are great. We have unit and e2e tests on this project.

### Unit tests

We use [Jest](https://jestjs.io/) and [Storybook](https://storybook.js.org/) on our tests.

#### Storybook

Storybook is a tool for developing UI Components and has some plugins to make Jest generate snapshots of them.

[On the root of the project](https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/index.js#L24), comment everything leaving only the last import to Storybook left  and refresh your project.
You'll see some tests like this:

<img src="https://user-images.githubusercontent.com/804994/89677725-56393200-d8c4-11ea-84b0-213be1d24e98.png" width="350" />

#### Jest

We use Jest for our unit tests and to generate Storybook snapshots. We have a pre-commit hook enforcing preventing commits that breaks any test.

To check for test issues on your code, run this on your terminal:

```sh
yarn test
```

### E2E tests

We use [Detox](https://github.com/wix/Detox) framework to end-to-end test our app and ensure everything is working properly.

[Follow this documentation to learn how to run it](https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/e2e).

### Pull request

As soon as your changes are ready, you can open a Pull Request.

The title of your PR should be descriptive, including either [NEW], [IMPROVEMENT] or [FIX] at the beginning, e.g. [FIX] App crashing on startup.

You may share working results prior to finishing, please include [WIP] in the title. This way anyone can look at your code: you can ask for help within the PR if you don't know how to solve a problem.

Your PR is automatically inspected by various tools, check their response and try to improve your code accordingly. Requests that fail to build or have wrong coding style won't be merged.
