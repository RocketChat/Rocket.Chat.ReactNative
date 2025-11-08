import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { TabView as ReanimatedTabView, type Route, type NavigationState } from 'reanimated-tab-view';

import TouchableOpacity from '../TouchableOpacity';
import styles from './styles';
import { useTheme } from '../../theme';

interface TabViewProps {
	routes: Route[];
	renderTabItem: (tab: Route, color: string) => React.ReactNode;
	renderScene: (props: { route: Route }) => React.ReactNode;
}

export const TabView = ({ routes, renderTabItem, renderScene }: TabViewProps) => {
	const { colors } = useTheme();
	const [navigationState, setNavigationState] = useState<NavigationState>({
		index: 0,
		routes
	});

	const handleIndexChange = useCallback((index: number) => {
		setNavigationState(state => ({ ...state, index }));
	}, []);

	const renderTabBar = useCallback(
		({ jumpTo, routeIndex }: { jumpTo: (key: string) => void; routeIndex: number }) => (
			<View style={styles.tabsContainer}>
				{routes.map((tab: Route, index: number) => (
					<View key={tab.key} style={styles.tab}>
						<TouchableOpacity onPress={() => jumpTo(tab.key)} hitSlop={10}>
							{renderTabItem(tab, routeIndex === index ? colors.strokeHighlight : colors.fontSecondaryInfo)}
						</TouchableOpacity>
						<View
							style={[
								styles.tabLine,
								{ backgroundColor: routeIndex === index ? colors.strokeHighlight : colors.strokeExtraLight }
							]}
						/>
					</View>
				))}
			</View>
		),
		[colors, renderTabItem, routes]
	);

	return (
		<ReanimatedTabView
			onIndexChange={handleIndexChange}
			navigationState={navigationState}
			renderScene={renderScene}
			renderMode='lazy'
			renderTabBar={renderTabBar}
		/>
	);
};
