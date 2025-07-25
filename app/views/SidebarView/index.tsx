import { memo, useEffect, useState } from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
import { shallowEqual } from 'react-redux';

import Avatar from '../../containers/Avatar';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import styles from './styles';
import { DrawerParamList } from '../../stacks/types';
import * as List from '../../containers/List';
import SupportedVersionsWarnItem from './components/SupportedVersionsWarnItem';
import { useAppSelector } from '../../lib/hooks';
import CustomStatus from './components/CustomStatus';
import Stacks from './components/Stacks';
import Admin from './components/Admin';

const Sidebar = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const { username, name } = useAppSelector(getUserSelector, shallowEqual);
	const { colors } = useTheme();
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const server = useAppSelector(state => state.server.server);
	const siteName = useAppSelector(state => state.settings.Site_Name) as string;
	const [currentScreen, setCurrentScreen] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = navigation.addListener('state', () => {
			setCurrentScreen(navigation.getState().routes[navigation.getState().index].name);
		});

		return unsubscribe;
	}, [navigation]);

	const onPressUser = () => {
		if (isMasterDetail) {
			return;
		}
		navigation.closeDrawer();
	};

	return (
		<SafeAreaView testID='sidebar-view' vertical={isMasterDetail}>
			<ScrollView style={styles.container} {...scrollPersistTaps}>
				<List.Separator />
				<TouchableWithoutFeedback onPress={onPressUser} testID='sidebar-close-drawer'>
					<View style={[styles.header, { backgroundColor: colors.surfaceRoom }]}>
						<Avatar text={username} style={styles.avatar} size={30} />
						<View style={styles.headerTextContainer}>
							<View style={styles.headerUsername}>
								<Text numberOfLines={1} style={[styles.username, { color: colors.fontTitlesLabels }]}>
									{useRealName ? name : username}
								</Text>
							</View>
							<Text
								style={[styles.currentServerText, { color: colors.fontTitlesLabels }]}
								numberOfLines={1}
								accessibilityLabel={`Connected to ${server}`}>
								{siteName}
							</Text>
						</View>
					</View>
				</TouchableWithoutFeedback>
				<List.Separator />

				<SupportedVersionsWarnItem />
				<CustomStatus />
				<Stacks currentScreen={currentScreen} />
				<Admin currentScreen={currentScreen} />
			</ScrollView>
		</SafeAreaView>
	);
};

export default memo(Sidebar);
