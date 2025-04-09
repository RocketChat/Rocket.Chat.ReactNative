import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as List from '../../../../containers/List';
import Touch from '../../../../containers/Touch';
import { CustomIcon } from '../../../../containers/CustomIcon';
import { useTheme } from '../../../../theme';
import { TServerHistoryModel } from '../../../../definitions';
import i18n from '../../../../i18n';

interface IServersHistoryActionSheetContent {
	serversHistory: TServerHistoryModel[];
	onPressServerHistory(serverHistory: TServerHistoryModel): void;
	onDelete(item: TServerHistoryModel): void;
}

export const ServersHistoryActionSheetContent = ({
	serversHistory,
	onPressServerHistory,
	onDelete
}: IServersHistoryActionSheetContent) => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	return (
		<View style={{ paddingBottom: bottom }}>
			<List.Container>
				<List.Separator />
				<>
					{serversHistory.map(item => (
						<>
							<List.Item
								accessibilityLabel={i18n.t('Connect_to_server_as_user', { serverUrl: item.url, user: item.username })}
								testID={`servers-history-${item.url}`}
								onPress={() => onPressServerHistory(item)}
								right={() => (
									<Touch
										accessibilityLabel={i18n.t('Remove_from_servers_history')}
										testID={`servers-history-delete-${item.url}`}
										onPress={() => onDelete(item)}>
										<CustomIcon name='delete' size={24} color={colors.fontDefault} />
									</Touch>
								)}
								styleTitle={{ fontSize: 18 }}
								translateTitle={false}
								translateSubtitle={false}
								title={item.url}
								subtitle={item.username}
							/>
							<List.Separator />
						</>
					))}
				</>
			</List.Container>
		</View>
	);
};
