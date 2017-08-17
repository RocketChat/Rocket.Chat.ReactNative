/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */

// import React from 'react';

import { storiesOf } from '@storybook/react-native';
// import { action } from '@storybook/addon-actions';
// import { linkTo } from '@storybook/addon-links';

import DirectMessage from './Channels/DirectMessage';

storiesOf('Channel Cell', module).add('Direct Messages', () => DirectMessage);

// storiesOf('Welcome', module).add('to Storybook', () => <Welcome showApp={linkTo('Button')} />);

// storiesOf('Button', module)
// 	.addDecorator(getStory => (
// 		<CenterView>
// 			{getStory()}
// 		</CenterView>
// 	))
// 	.add('with text', () => (
// 		<Button onPress={action('clicked-text')}>
// 			<Text>Hello Button</Text>
// 		</Button>
// 	))
