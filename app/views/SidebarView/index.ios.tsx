import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { View } from 'react-native';

import styles from './styles';
import { type DrawerParamList } from '~/stacks/types';
import SidebarSections from './SidebarSections.ios';

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => (
	<View testID='sidebar-view' style={styles.container}>
		<SidebarSections navigation={navigation} />
	</View>
);

export default SidebarView;
