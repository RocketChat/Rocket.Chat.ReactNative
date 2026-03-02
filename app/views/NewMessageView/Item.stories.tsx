import React from 'react';
import { View, StyleSheet } from 'react-native';

import Item from './Item';
import type { TSubscriptionModel } from '../../definitions';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		flex: 1,
		minHeight: 100
	}
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

// Mock room for direct message - uids must include current user ('abc' from preview) and the other user
const createMockRoom = (overrides: Partial<TSubscriptionModel> = {}): TSubscriptionModel =>
	({
		_id: 'room1',
		rid: 'room1',
		id: 'room1',
		t: 'd',
		name: 'john.doe',
		fname: 'John Doe',
		uids: ['abc', 'user123'],
		ls: new Date(),
		ts: new Date(),
		lm: '',
		lr: '',
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		tunread: [],
		open: true,
		alert: false,
		f: false,
		archived: false,
		roomUpdatedAt: new Date(),
		ro: false,
		...overrides
	}) as TSubscriptionModel;

export default {
	title: 'NewMessageView/Item',
	component: Item
};

export const Default = () => (
	<Wrapper>
		<Item
			room={createMockRoom()}
			name='John Doe'
			username='john.doe'
			onPress={() => {}}
			testID='new-message-view-item-john.doe'
		/>
	</Wrapper>
);

export const WithLongPress = () => (
	<Wrapper>
		<Item
			room={createMockRoom()}
			name='Jane Smith'
			username='jane.smith'
			onPress={() => {}}
			onLongPress={() => {}}
			testID='new-message-view-item-jane.smith'
		/>
	</Wrapper>
);

export const WithCustomStyle = () => (
	<Wrapper>
		<Item
			room={createMockRoom()}
			name='Bob Burnquist'
			username='bob.burnquist'
			onPress={() => {}}
			testID='new-message-view-item-bob.burnquist'
			style={{ marginVertical: 8 }}
		/>
	</Wrapper>
);

export const LongName = () => (
	<Wrapper>
		<Item
			room={createMockRoom()}
			name='Very Long Display Name That Might Get Truncated'
			username='long.name'
			onPress={() => {}}
			testID='new-message-view-item-long.name'
		/>
	</Wrapper>
);
