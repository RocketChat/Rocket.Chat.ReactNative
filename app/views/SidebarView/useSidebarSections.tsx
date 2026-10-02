import { type DrawerNavigationProp } from '@react-navigation/drawer';

import * as List from '~/containers/List';
import { type DrawerParamList } from '~/stacks/types';
import SidebarView from '.';

export const useSidebarSections = (navigation: DrawerNavigationProp<DrawerParamList>) => ({
	sections: (
		<List.Section>
			<SidebarView navigation={navigation} />
		</List.Section>
	)
});
