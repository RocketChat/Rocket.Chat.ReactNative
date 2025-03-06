import React from 'react';
import { View } from 'react-native';

import CollapsibleText from '.';

const smallText = 'Lorem ipsum dolor sit amet';

const text120 =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel vestibulum neque. Proin dignissim neque in urna nec.';

export default {
	title: 'Collapsible Text'
};

export const Item = () => (
	<View style={{ padding: 20 }}>
		<CollapsibleText linesToTruncate={1} msg={`${smallText}`} />
		<CollapsibleText linesToTruncate={1} msg={`linesToTruncate: 1 - ${text120}`} />
		<CollapsibleText linesToTruncate={2} msg={`linesToTruncate: 2 - ${text120}`} />
	</View>
);
