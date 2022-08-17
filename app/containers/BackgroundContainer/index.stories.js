import React from 'react';

import { ThemeContext } from '../../theme';
import { longText } from '../../../storybook/utils';
import BackgroundContainer from '.';

export default {
	title: 'BackgroundContainer'
};

export const Basic = () => <BackgroundContainer />;

export const Loading = () => <BackgroundContainer loading />;

export const Text = () => <BackgroundContainer text='Text here' />;

export const LongText = () => <BackgroundContainer text={longText} />;

const ThemeStory = ({ theme, ...props }) => (
	<ThemeContext.Provider value={{ theme }}>
		<BackgroundContainer {...props} />
	</ThemeContext.Provider>
);

export const DarkThemeLoading = () => <ThemeStory theme='dark' loading />;

export const DarkThemeText = () => <ThemeStory theme='dark' text={longText} />;

export const BlackThemeLoading = () => <ThemeStory theme='black' loading />;

export const BlackThemeText = () => <ThemeStory theme='black' text={longText} />;
