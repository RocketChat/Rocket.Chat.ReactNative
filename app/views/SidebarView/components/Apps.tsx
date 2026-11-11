import { memo } from 'react';

import * as List from '~/containers/List';
import { useSidebarAppActions } from './useSidebarAppActions';

const Apps = () => {
	const appActions = useSidebarAppActions();

	if (!appActions.length) {
		return null;
	}

	return (
		<>
			<List.Header title='Apps' />
			{appActions.map(item => (
				<List.Item
					key={item.id}
					title={item.title}
					translateTitle={false}
					left={() => <List.Icon name='apps' />}
					onPress={item.onPress}
					testID={item.testID}
				/>
			))}
			<List.Separator />
		</>
	);
};

export default memo(Apps);
