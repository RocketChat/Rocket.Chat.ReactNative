import React from 'react';
import { View, StyleSheet } from 'react-native';

import Item from './Item';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		flex: 1,
		minHeight: 100
	}
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

export default {
	title: 'NewMessageView/Item',
	component: Item
};

export const Default = () => (
	<Wrapper>
		<Item
			userId='user123'
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
			userId='user123'
			name='Jane Smith'
			username='jane.smith'
			onPress={() => {}}
			onLongPress={() => {}}
			testID='new-message-view-item-jane.smith'
		/>
	</Wrapper>
);

export const LongName = () => (
	<Wrapper>
		<Item
			userId='user123'
			name='Very Long Display Name That Might Get Truncated'
			username='long.name'
			onPress={() => {}}
			testID='new-message-view-item-long.name'
		/>
	</Wrapper>
);
