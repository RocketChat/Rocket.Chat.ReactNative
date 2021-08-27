/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react-native';

import BackgroundContainer from '.';
import { ThemeContext } from '../../theme';
import { longText } from '../../../storybook/utils';

const stories = storiesOf('BackgroundContainer', module);

stories.add('basic', () => (
	<BackgroundContainer />
));

stories.add('loading', () => (
	<BackgroundContainer loading />
));

stories.add('text', () => (
	<BackgroundContainer text='Text here' />
));

stories.add('long text', () => (
	<BackgroundContainer text={longText} />
));

const ThemeStory = ({ theme, ...props }) => (
	<ThemeContext.Provider
		value={{ theme }}
	>
		<BackgroundContainer {...props} />
	</ThemeContext.Provider>
);

stories.add('dark theme - loading', () => (
	<ThemeStory theme='dark' loading />
));

stories.add('dark theme - text', () => (
	<ThemeStory theme='dark' text={longText} />
));

stories.add('black theme - loading', () => (
	<ThemeStory theme='black' loading />
));

stories.add('black theme - text', () => (
	<ThemeStory theme='black' text={longText} />
));
