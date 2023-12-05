import { render } from '@testing-library/react-native';
import React from 'react';

import CollapsibleText from './CollapsibleText';

const testID = 'collapsible-text';

const Render = ({ msg, linesToTruncate }: { msg: string; linesToTruncate: number }) => (
	<CollapsibleText msg={msg} testID={testID} linesToTruncate={linesToTruncate} />
);

describe('CollapsibleText', () => {
	test('rendered', async () => {
		const text120 =
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel vestibulum neque. Proin dignissim neque in urna nec.';
		const { findByTestId } = render(<Render linesToTruncate={1} msg={text120} />);
		const collapsibleText = await findByTestId(testID);
		expect(collapsibleText).toBeTruthy();
	});
});
