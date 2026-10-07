import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { View } from 'react-native';

import ListContainer from '~/containers/List/components/ListContainer.ios';
import styles from './styles';
import { type DrawerParamList } from '~/stacks/types';
import { useSidebarSections } from './useSidebarSections.ios';

const SidebarView = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const { sections } = useSidebarSections(navigation);

	return (
		<View testID='sidebar-view' style={styles.container}>
			<ListContainer>{sections}</ListContainer>
		</View>
	);
};

export default SidebarView;
