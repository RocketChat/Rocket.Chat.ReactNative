import { memo } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';

import * as List from '~/containers/List';
import { showActionSheetRef } from '~/containers/ActionSheet';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { type DrawerParamList } from '~/stacks/types';
import ServersList from '~/views/RoomsListView/components/ServersList';

const formatServerHost = (server: string) => server.replace(/(^\w+:|^)\/\//, '');

const Workspaces = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const server = useAppSelector(state => state.server.server);

	const onPress = () => {
		navigation.closeDrawer();
		showActionSheetRef({ children: <ServersList />, enableContentPanningGesture: false });
	};

	return (
		<>
			<List.Item
				title={'Workspaces'}
				subtitle={formatServerHost(server)}
				translateSubtitle={false}
				left={() => <List.Icon name='workspaces' />}
				onPress={onPress}
				testID='sidebar-workspaces'
			/>
			<List.Separator />
		</>
	);
};

export default memo(Workspaces);
