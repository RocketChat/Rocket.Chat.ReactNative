/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { View } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import Tag from '../../app/presentation/RoomItem/Tag';

const stories = storiesOf('Tag', module);

const shortText = 'Short';
const midText = 'A bit much longer tag';
const longText = 'This is a looooooooooooooooooooooooooong text in order to test the tag';

stories.add('usage', () => (
	<View style={{ justifyContent: 'space-between', marginHorizontal: 16 }}>
		<Tag name={shortText} />
		<Tag name={midText} />
		<Tag name={longText} />
	</View>
));
