import { View } from 'react-native';
import { type ReactElement } from 'react';

import * as List from '~/containers/List';
import { type IActionsSection, useMemberActions } from './useMemberActions';

export default function ActionsSection(props: IActionsSection): ReactElement {
	const actions = useMemberActions(props);

	return (
		<View style={{ paddingTop: actions.length ? 16 : 0 }}>
			{actions.map((action, index) => (
				<View key={action.testID}>
					{index === 0 ? <List.Separator /> : null}
					<List.Item
						title={action.title}
						onPress={action.onPress}
						testID={action.testID}
						left={() => <List.Icon name={action.icon} />}
						showActionIndicator
						disabled={action.disabled}
						disabledReason={action.disabledReason}
					/>
					<List.Separator />
				</View>
			))}
		</View>
	);
}
