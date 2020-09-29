/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */
import React from 'react';
import { storiesOf } from '@storybook/react-native';

import * as List from '../../app/containers/List';
import { longText } from '../utils';

const stories = storiesOf('List', module);

stories.add('title and subtitle', () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Chats' />
		<List.Separator />
		<List.Item title='Chats' subtitle='All' />
		<List.Separator />
		<List.Item title={longText} subtitle={longText} translateTitle={false} translateSubtitle={false} testID='test-id' />
		<List.Separator />
	</List.Container>
));

stories.add('pressable', () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Press me' onPress={() => alert('Hi there!')} translateTitle={false} />
		<List.Separator />
		<List.Item title={'I\'m disabled'} onPress={() => alert('Hi there!')} disabled translateTitle={false} />
		<List.Separator />
	</List.Container>
));

stories.add('with icon', () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Icon Left' translateTitle={false} left={() => <List.Icon name='emoji' />} />
		<List.Separator />
		<List.Item title='Icon Right' translateTitle={false} right={() => <List.Icon name='emoji' />} />
		<List.Separator />
		<List.Item
			title={longText}
			subtitle={longText}
			translateTitle={false}
			translateSubtitle={false}
			left={() => <List.Icon name='emoji' />}
			right={() => <List.Icon name='emoji' />}
		/>
		<List.Separator />
		<List.Item title='Show Action Indicator' translateTitle={false} showActionIndicator />
		<List.Separator />
	</List.Container>
));
