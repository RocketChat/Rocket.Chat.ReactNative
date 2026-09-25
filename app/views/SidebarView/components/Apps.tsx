import { memo } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';

import * as List from '~/containers/List';
import { UIActionButtonContext } from '~/lib/apps/definitions';
import { triggerAppActionButton } from '~/lib/apps/triggerAppActionButton';
import { type IAppActionButtonItem, useAppActionButtons } from '~/lib/apps/useAppActionButtons';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { type DrawerParamList } from '~/stacks/types';

const Apps = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const appActions = useAppActionButtons({ context: UIActionButtonContext.USER_DROPDOWN_ACTION });

	if (!appActions.length) {
		return null;
	}

	const onPress = ({ button }: IAppActionButtonItem) => {
		logEvent(events.SIDEBAR_APP_ACTION, { appId: button.appId, actionId: button.actionId });
		navigation.closeDrawer();
		triggerAppActionButton({ button });
	};

	return (
		<>
			<List.Header title='Apps' />
			{appActions.map(item => (
				<List.Item
					key={item.id}
					title={item.label}
					translateTitle={false}
					left={() => <List.Icon name='apps' />}
					onPress={() => onPress(item)}
					testID={`sidebar-app-${item.id}`}
				/>
			))}
			<List.Separator />
		</>
	);
};

export default memo(Apps);
