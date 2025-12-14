import React from 'react';
import { composeStories } from '@storybook/react';
import { renderAsync } from '@testing-library/react-native';
import preview from './preview';
import { mockedStore } from '../app/reducers/mockedStore';
import { initStore } from '../app/lib/store/auxStore';

initStore(mockedStore);

export function generateSnapshots(stories: any) {
	describe('Story Snapshots:', () => {
		const composedStories = composeStories(stories, {
			decorators: preview.decorators
		});
		Object.entries(composedStories).forEach(([name, story]) => {
			test(`${name} should match snapshot`, async () => {
				const rendered = await renderAsync(React.createElement(story as React.ComponentType));
				expect(rendered.toJSON()).toMatchSnapshot();
			});
		});
	});
}
