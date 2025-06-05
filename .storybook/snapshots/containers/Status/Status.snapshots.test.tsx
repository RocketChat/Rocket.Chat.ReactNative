import React from 'react';
import { composeStories } from '@storybook/react';
import { renderWithProviders } from '../../../test-setup';
import * as stories from '../../../../../app/containers/Status/Status.stories';

const composedStories = composeStories(stories);

describe('Status Snapshots', () => {
	Object.keys(composedStories).forEach(storyName => {
		it('should render ' + storyName + ' correctly', () => {
			const Story = composedStories[storyName];
			const tree = renderWithProviders(Story);
			expect(tree).toMatchSnapshot();
		});
	});
});