import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import scrollPersistTaps from '~/lib/methods/helpers/scrollPersistTaps';
import { useTheme } from '~/theme';
import styles from './styles';
import { type DrawerParamList } from '~/stacks/types';
import SidebarContent from './components/SidebarContent';

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const { top } = useSafeAreaInsets();
	const { colors } = useTheme();

	return (
		<View testID='sidebar-view' style={[styles.container, { backgroundColor: colors.surfaceTint }]}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={{ paddingTop: top }}
				contentInsetAdjustmentBehavior='never'
				{...scrollPersistTaps}>
				<SidebarContent navigation={navigation} />
			</ScrollView>
		</View>
	);
};

export default SidebarView;
