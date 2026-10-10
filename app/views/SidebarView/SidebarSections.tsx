import { type DrawerNavigationProp } from '@react-navigation/drawer';

import * as List from '~/containers/List';
import { type DrawerParamList } from '~/stacks/types';
import SidebarContent from './components/SidebarContent';

const SidebarSections = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => (
	<List.Section>
		<SidebarContent navigation={navigation} />
	</List.Section>
);

export default SidebarSections;
