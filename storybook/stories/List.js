/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */
import React from 'react';
import { storiesOf } from '@storybook/react-native';

import * as List from '../../app/containers/List';
import SafeAreaView from '../../app/containers/SafeAreaView';
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


stories.add('header', () => (
	<List.Container>
		<List.Header title='Chats' />
		<List.Header title={longText} translateTitle={false} />
	</List.Container>
));

stories.add('icon', () => (
	<List.Container>
		<List.Icon name='emoji' />
	</List.Container>
));

stories.add('separator', () => (
	<List.Container>
		<List.Separator />
	</List.Container>
));

stories.add('with section', () => (
	<SafeAreaView>
		<List.Container>
			<List.Section>
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
			</List.Section>
			<List.Section>
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
			</List.Section>
			<List.Section title='Chats'>
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
			</List.Section>
			<List.Section title={longText} translateTitle={false}>
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
				<List.Item title='Section Item' translateTitle={false} />
				<List.Separator />
			</List.Section>
		</List.Container>
	</SafeAreaView>
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

stories.add('with custom color', () => (
	<List.Container>
		<List.Separator />
		<List.Item title='Chats' color='red' />
		<List.Separator />
	</List.Container>
));
