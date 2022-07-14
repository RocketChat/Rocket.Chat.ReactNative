import React from 'react';
import { Text, Pressable, View } from 'react-native';

import styles from './styles';
import { useTheme } from '../../theme';
import { ITabBarProps } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';

const TabBar = ({ activeTab, tabs, goToPage, tabEmojiStyle }: ITabBarProps): React.ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={styles.tabsContainer}>
			{tabs?.map((tab, i) => (
				<Pressable
					key={tab}
					onPress={() => goToPage?.(i)}
					testID={`reaction-picker-${tab}`}
					android_ripple={{ color: colors.bannerBackground }}
					style={({ pressed }: { pressed: boolean }) => [
						styles.tab,
						{
							backgroundColor: isIOS && pressed ? colors.bannerBackground : 'transparent'
						}
					]}>
					<Text style={[styles.tabEmoji, tabEmojiStyle]}>{tab}</Text>
					<View style={activeTab === i ? [styles.activeTabLine, { backgroundColor: colors.tintColor }] : styles.tabLine} />
				</Pressable>
			))}
		</View>
	);
};

export default TabBar;
