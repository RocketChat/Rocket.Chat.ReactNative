import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';

export function testAllStories(stories: Record<string, any>, label: string) {
	const component = stories.default?.component;

	if (!component) {
		throw new Error(`Missing default.component in ${label} stories`);
	}

	describe(`Story snapshots: ${label}`, () => {
		Object.entries(stories).forEach(([storyName, storyDef]) => {
			if (storyName === 'default') return;

			test(`${storyName} snapshot`, () => {
				const element = typeof storyDef === 'function' ? storyDef() : React.createElement(component, storyDef.args || {});

				let tree: ReactTestRenderer | undefined;
				act(() => {
					tree = renderer.create(element);
				});
				expect(tree?.toJSON()).toMatchSnapshot();
			});
		});
	});
}
