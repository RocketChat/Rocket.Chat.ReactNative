import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const styles = StyleSheet.create({
	firstUnread: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 5
	},
	firstUnreadLine: {
		borderTopColor: 'red',
		borderTopWidth: StyleSheet.hairlineWidth,
		flex: 1
	},
	firstUnreadBadge: {
		color: 'red',
		backgroundColor: '#fff',
		fontSize: 11,
		paddingHorizontal: 10,
		transform: [{ scaleY: -1 }]
	}
});

const UnreadSeparator = () => (
	<View style={styles.firstUnread}>
		<View style={styles.firstUnreadLine} />
		<Text style={styles.firstUnreadBadge}>unread messages</Text>
	</View>
);

export default UnreadSeparator;
