import { type DrawerNavigationProp } from '@react-navigation/drawer';

import * as List from '~/containers/List';
import { type DrawerParamList } from '~/stacks/types';
import SidebarView from '.';

const SidebarSections = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => (
	<List.Section>
		<SidebarView navigation={navigation} />
	</List.Section>
);

export default SidebarSections;
