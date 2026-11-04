import { type DrawerNavigationProp } from '@react-navigation/drawer';

import { type DrawerParamList } from '~/stacks/types';
import SupportedVersionsWarnItem from './SupportedVersionsWarnItem';
import CustomStatus from './CustomStatus';
import Stacks from './Stacks';
import Admin from './Admin';
import Profile from './Profile';
import { useCurrentScreen } from '../useCurrentScreen';

const SidebarContent = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const currentScreen = useCurrentScreen(navigation);

	return (
		<>
			<Profile navigation={navigation} />
			<SupportedVersionsWarnItem />
			<CustomStatus />
			<Stacks currentScreen={currentScreen} />
			<Admin currentScreen={currentScreen} />
		</>
	);
};

export default SidebarContent;
