import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { View } from 'react-native';

import ListContainer from '~/containers/List/components/ListContainer.ios';
import styles from './styles';
import { type DrawerParamList } from '~/stacks/types';
import SidebarSections from './SidebarSections.ios';

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => (
	<View testID='sidebar-view' style={styles.container}>
		<ListContainer>
			<SidebarSections navigation={navigation} />
		</ListContainer>
	</View>
);

export default SidebarView;
