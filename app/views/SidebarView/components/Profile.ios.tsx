import { memo } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { shallowEqual } from 'react-redux';

import Avatar from '~/containers/Avatar';
import { getUserSelector } from '~/selectors/login';
import { type DrawerParamList } from '~/stacks/types';
import * as List from '~/containers/List';
import { asNativeListRow } from '~/containers/List/nativeListRow';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';

const Profile = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const isMasterDetail = useMasterDetail();
	const { username, name, statusText } = useAppSelector(getUserSelector, shallowEqual);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const siteName = useAppSelector(state => state.settings.Site_Name) as string;

	const onPressUser = () => {
		if (isMasterDetail) {
			return;
		}
		navigation.closeDrawer();
	};

	return (
		<List.Item
			title={(useRealName ? name : username) ?? ''}
			translateTitle={false}
			subtitle={statusText || siteName}
			translateSubtitle={false}
			left={() => <Avatar text={username} size={36} />}
			onPress={onPressUser}
			testID='sidebar-close-drawer'
			numberOfLines={1}
		/>
	);
};

export default asNativeListRow(memo(Profile));
