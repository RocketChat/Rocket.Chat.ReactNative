import SupportedVersionsWarnItem from './SupportedVersionsWarnItem';
import CustomStatus from './CustomStatus';
import Stacks from './Stacks';
import Admin from './Admin';
import Profile from './Profile';

const MenuContent = () => (
	<>
		<Profile />
		<SupportedVersionsWarnItem />
		<CustomStatus />
		<Stacks />
		<Admin />
	</>
);

export default MenuContent;
