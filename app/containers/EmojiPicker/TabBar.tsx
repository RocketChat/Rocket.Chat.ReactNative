import React from 'react';
import { Pressable, View } from 'react-native';

import styles from './styles';
import { useTheme } from '../../theme';
import { ITabBarProps } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';
import { CustomIcon } from '../CustomIcon';

const TabBar = ({ tabs, activeTab, onPress, showFrequentlyUsed }: ITabBarProps): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={styles.tabsContainer}>
			{tabs?.map((tab, i) => {
				if (i === 0 && !showFrequentlyUsed) return null;
				return (
					<Pressable
						key={tab.key}
						onPress={() => onPress(tab.key)}
						testID={`emoji-picker-tab-${tab.key}`}
						android_ripple={{ color: colors.bannerBackground }}
						style={({ pressed }: { pressed: boolean }) => [
							styles.tab,
							{
								backgroundColor: isIOS && pressed ? colors.bannerBackground : 'transparent'
							}
						]}
					>
						<CustomIcon name={tab.key} size={24} color={activeTab === i ? colors.tintColor : colors.auxiliaryTintColor} />
						<View style={activeTab === i ? [styles.activeTabLine, { backgroundColor: colors.tintColor }] : styles.tabLine} />
					</Pressable>
				);
			})}
		</View>
	);
};

export default TabBar;
