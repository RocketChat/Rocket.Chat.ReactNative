import React from 'react';
import { Pressable, View } from 'react-native';

import styles from './styles';
import { useTheme } from '../../theme';
import { ITabBarProps } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';
import { CustomIcon } from '../CustomIcon';

const TabBar = ({ activeTab, tabs, goToPage }: ITabBarProps): React.ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={styles.tabsContainer}>
			{tabs?.map((tab, i) => (
				<Pressable
					key={tab}
					onPress={() => goToPage?.(i)}
					testID={`emoji-picker-tab-${tab}`}
					android_ripple={{ color: colors.bannerBackground }}
					style={({ pressed }: { pressed: boolean }) => [
						styles.tab,
						{
							backgroundColor: isIOS && pressed ? colors.bannerBackground : 'transparent'
						}
					]}
				>
					<CustomIcon name={tab} size={24} color={activeTab === i ? colors.tintColor : colors.auxiliaryTintColor} />
					<View
						style={
							activeTab === i
								? [styles.activeTabLine, { backgroundColor: colors.tintColor }]
								: [styles.tabLine, { backgroundColor: colors.borderColor }]
						}
					/>
				</Pressable>
			))}
		</View>
	);
};

export default TabBar;
