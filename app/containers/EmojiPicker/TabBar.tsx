import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import styles from './styles';
import { useTheme } from '../../theme';
import { ITabBarProps } from './interfaces';

const TabBar = React.memo(({ activeTab, tabs, goToPage, tabEmojiStyle }: ITabBarProps) => {
	const { colors } = useTheme();

	return (
		<View style={styles.tabsContainer}>
			{tabs?.map((tab, i) => (
				<TouchableOpacity
					activeOpacity={0.7}
					key={tab}
					onPress={() => {
						if (goToPage) {
							goToPage(i);
						}
					}}
					style={styles.tab}
					testID={`reaction-picker-${tab}`}>
					<Text style={[styles.tabEmoji, tabEmojiStyle]}>{tab}</Text>
					{activeTab === i ? (
						<View style={[styles.activeTabLine, { backgroundColor: colors.tintColor }]} />
					) : (
						<View style={styles.tabLine} />
					)}
				</TouchableOpacity>
			))}
		</View>
	);
});

export default TabBar;
