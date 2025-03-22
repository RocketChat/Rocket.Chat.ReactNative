import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import styles, { EMOJI_BUTTON_SIZE } from './styles';
import { useTheme } from '../../theme';
import { ITabBarProps } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';
import { CustomIcon } from '../CustomIcon';

const TabBar = ({ activeTab, tabs, goToPage }: ITabBarProps): React.ReactElement => {
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();
	const height = EMOJI_BUTTON_SIZE * fontScale;

	return (
		<View style={[styles.tabsContainer, { height }]}>
			{tabs?.map((tab, i) => (
				<Pressable
					key={tab}
					onPress={() => goToPage?.(i)}
					testID={`emoji-picker-tab-${tab}`}
					android_ripple={{ color: colors.buttonBackgroundSecondaryPress }}
					style={({ pressed }: { pressed: boolean }) => [
						styles.tab,
						{
							backgroundColor: isIOS && pressed ? colors.buttonBackgroundSecondaryPress : 'transparent'
						}
					]}>
					<CustomIcon name={tab} size={24} color={activeTab === i ? colors.strokeHighlight : colors.fontSecondaryInfo} />
					<View
						style={
							activeTab === i
								? [styles.activeTabLine, { backgroundColor: colors.strokeHighlight }]
								: [styles.tabLine, { backgroundColor: colors.strokeExtraLight }]
						}
					/>
				</Pressable>
			))}
		</View>
	);
};

export default TabBar;
