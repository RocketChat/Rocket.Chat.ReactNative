import { memo } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { shallowEqual } from 'react-redux';

import Avatar from '~/containers/Avatar';
import { getUserSelector } from '~/selectors/login';
import { type DrawerParamList } from '~/stacks/types';
import * as List from '~/containers/List';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';

const PROFILE_ROW_HEIGHT = 68;

const Profile = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const isMasterDetail = useMasterDetail();
	const { username, name, statusText } = useAppSelector(getUserSelector, shallowEqual);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const server = useAppSelector(state => state.server.server);
	const siteName = useAppSelector(state => state.settings.Site_Name) as string;

	const displayName = (useRealName ? name : username) ?? '';
	const subtitle = statusText || siteName;

	const onPressUser = () => {
		if (isMasterDetail) {
			return;
		}
		navigation.closeDrawer();
	};

	return (
		<List.Item
			title={displayName}
			translateTitle={false}
			subtitle={subtitle}
			translateSubtitle={false}
			left={() => <Avatar text={username} size={40} />}
			heightContainer={PROFILE_ROW_HEIGHT}
			onPress={onPressUser}
			testID='sidebar-close-drawer'
			accessibilityLabel={`${displayName} ${subtitle} Connected to ${server}`}
			numberOfLines={1}
		/>
	);
};

export default memo(Profile);
