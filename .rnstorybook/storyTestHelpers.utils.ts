import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import { Provider } from 'react-redux';
import { composeStories } from '@storybook/react';

import { mockedStore } from '../app/reducers/mockedStore';

export function testAllStories(stories: any, label: string) {
	const composedStories = composeStories(stories);

	describe(`Story snapshots: ${label}`, () => {
		Object.entries(composedStories).forEach(([storyName, Story]) => {
			test(`${storyName} snapshot`, () => {
				let tree: ReactTestRenderer | undefined;
				act(() => {
					tree = renderer.create(
						React.createElement(Provider, { store: mockedStore }, React.createElement(Story as React.ComponentType))
					);
				});
				expect(tree?.toJSON()).toMatchSnapshot();
			});
		});
	});
}
