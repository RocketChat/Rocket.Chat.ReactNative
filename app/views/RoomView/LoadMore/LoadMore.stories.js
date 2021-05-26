/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types, react/destructuring-assignment */
import React from 'react';
import { ScrollView } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import LoadMore from './index';
import { longText } from '../../../../storybook/utils';
import { ThemeContext } from '../../../theme';
import {
	Message, StoryProvider, MessageDecorator
} from '../../../../storybook/stories/Message';
import { themes } from '../../../constants/colors';
import { MESSAGE_TYPE_LOAD_MORE, MESSAGE_TYPE_LOAD_NEXT_CHUNK, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK } from '../../../constants/messageTypeLoad';

const stories = storiesOf('LoadMore', module);

// FIXME: for some reason, this promise never resolves on Storybook (it works on the app, so maybe the issue isn't on the component)
const load = () => new Promise(res => setTimeout(res, 1000));

stories.add('basic', () => (
	<>
		<LoadMore load={load} />
		<LoadMore load={load} runOnRender />
		<LoadMore load={load} type={MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK} />
		<LoadMore load={load} type={MESSAGE_TYPE_LOAD_NEXT_CHUNK} />
	</>
));

const ThemeStory = ({ theme }) => (
	<ThemeContext.Provider
		value={{ theme }}
	>
		<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }}>
			<LoadMore load={load} type={MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK} />
			<Message msg='Hey!' theme={theme} />
			<Message msg={longText} theme={theme} isHeader={false} />
			<Message msg='Older message' theme={theme} isHeader={false} />
			<LoadMore load={load} type={MESSAGE_TYPE_LOAD_NEXT_CHUNK} />
			<LoadMore load={load} type={MESSAGE_TYPE_LOAD_MORE} />
			<Message msg={longText} theme={theme} />
			<Message msg='This is the third message' isHeader={false} theme={theme} />
			<Message msg='This is the second message' isHeader={false} theme={theme} />
			<Message msg='This is the first message' theme={theme} />
		</ScrollView>
	</ThemeContext.Provider>
);

stories
	.addDecorator(StoryProvider)
	.addDecorator(MessageDecorator)
	.add('light theme', () => <ThemeStory theme='light' />);

stories
	.addDecorator(StoryProvider)
	.addDecorator(MessageDecorator)
	.add('dark theme', () => <ThemeStory theme='dark' />);

stories
	.addDecorator(StoryProvider)
	.addDecorator(MessageDecorator)
	.add('black theme', () => <ThemeStory theme='black' />);

