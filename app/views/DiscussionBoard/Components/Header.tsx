import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';

import { withTheme } from '../../../theme';
import { DiscussionTabs, DiscussionHeaderProps } from '../DiscussionHomeView/interaces';

const DiscussionHeader: React.FC<DiscussionHeaderProps> = ({ onTabChange }) => {
	const [selectedTab, setSelectedTab] = useState(DiscussionTabs.DISCUSSION_BOARDS);
	const [headerWidth, setHeaderWidth] = useState(0);
	const marginLeft = useRef(new Animated.Value(0)).current;

	const moveTabHighlight = (tab: DiscussionTabs) => {
		const animation = Animated.timing(marginLeft, {
			toValue: tab === DiscussionTabs.DISCUSSION_BOARDS ? 0 : headerWidth / 2,
			duration: 500,
			useNativeDriver: false
		});
		animation.start(() => {});
	};

	const onLayout = (event: any) => {
		const { width } = event.nativeEvent.layout;
		setHeaderWidth(width);
	};

	const onSelectTab = (tab: DiscussionTabs) => {
		if (tab === selectedTab) {
			return;
		}
		setSelectedTab(tab);
		moveTabHighlight(tab);
		onTabChange(tab);
	};

	return (
		<View style={styles.container}>
			<View style={styles.headerRow} onLayout={onLayout}>
				<TouchableOpacity style={styles.headerButton} onPress={() => onSelectTab(DiscussionTabs.DISCUSSION_BOARDS)}>
					<Text
						style={selectedTab === DiscussionTabs.DISCUSSION_BOARDS ? styles.headerButtonTextSelected : styles.headerButtonText}
					>
						Discussion Boards
					</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.headerButton} onPress={() => onSelectTab(DiscussionTabs.SAVED_POSTS)}>
					<Text style={selectedTab === DiscussionTabs.SAVED_POSTS ? styles.headerButtonTextSelected : styles.headerButtonText}>
						Saved Posts
					</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.headerBreak}>
				<Animated.View style={[styles.headerBreakHighlight, { marginLeft }]} />
			</View>
		</View>
	);
};

export default withTheme(DiscussionHeader);

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20,
		width: '100%'
	},
	headerRow: {
		flexDirection: 'row'
	},
	headerButton: {
		width: '50%',
		height: 39,
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerButtonText: {
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 19,
		color: '#00000080'
	},
	headerButtonTextSelected: {
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 19,
		color: '#000000'
	},
	headerBreak: {
		height: 1,
		width: '100%',
		backgroundColor: '#E3E3E3',
		marginBottom: 4
	},
	headerBreakHighlight: {
		backgroundColor: '#000000',
		width: '50%',
		height: 1
	}
});
