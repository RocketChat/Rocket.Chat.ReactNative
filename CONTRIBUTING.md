# Contributing Guidelines 

Great to have you here! Here are a few ways you can help make this project better!

## Setting up a development environment

Refer to [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) to make sure everything is up and running.

*Note: you'll need a MacOS to run iOS apps*
*Note: We don't support Expo managed flow*

### How to run

Clone repository and install dependencies:
```sh
git clone git@github.com:RocketChat/Rocket.Chat.ReactNative.git
cd Rocket.Chat.ReactNative
yarn
```

Run the app:
```sh
npx pod-install
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

## Code formatting

We use [Prettier](https://prettier.io) to format the code style in our project. We have a pre-commit hook enforcing commits to follow our style guides.

To fix your code formatting issues, run this on your terminal:

```sh
yarn prettier
```

[Check this link](https://prettier.io/docs/en/editors.html) to see how to integrate Prettier with your preferred code editor, and run Prettier when save your file for example.

## Tests

It's always important to ensure everything is working properly and that's why tests are great. We have unit and e2e tests on this project.

### Unit tests

We use [Jest](https://jestjs.io/) and [Storybook](https://storybook.js.org/) on our tests.

#### Storybook

Storybook is a tool for developing UI Components and has some plugins to make Jest generate snapshots of them.

To open the Storybook, run yarn `storybook:start`, and then use `yarn android` or `yarn ios` to launch it on your desired platform.

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

Refer to [Pull request's tags](https://developer.rocket.chat/docs/pull-requests-tags) to write a good PR title.

Open your PR as draft before asking for review. Your PR is automatically inspected by various tools, check their response and try to improve your code accordingly. Requests that fail to build or have wrong coding style won't be merged.