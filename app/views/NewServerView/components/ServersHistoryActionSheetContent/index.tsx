import { Fragment } from 'react';
import { View, Text } from 'react-native';
import { A11y } from 'react-native-a11y-order';
import { StyleSheet } from 'react-native-unistyles';

import * as List from '../../../../containers/List';
import { type TServerHistoryModel } from '../../../../definitions';
import ServersHistoryItem from '../ServersHistoryItem';
import I18n from '../../../../i18n';
import sharedStyles from '../../../Styles';

const styles = StyleSheet.create((theme, rt) => ({
	outerContainer: {
		backgroundColor: theme.colors.surfaceLight,
		paddingBottom: rt.insets.bottom
	},
	header: {
		height: 41,
		borderBottomWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		borderColor: theme.colors.strokeLight
	},
	headerText: {
		fontSize: 16,
		marginLeft: 12,
		...sharedStyles.textRegular,
		color: theme.colors.fontSecondaryInfo
	}
}));

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
	return (
		<View style={styles.outerContainer}>
			<View style={styles.header}>
				<Text style={styles.headerText}>{I18n.t('Workspaces')}</Text>
			</View>
			<List.Separator />
			{serversHistory.map(item => (
				<Fragment key={item.id}>
					<A11y.Order>
						<A11y.Index index={1}>
							<ServersHistoryItem item={item} onPress={() => onPressServerHistory(item)} onDeletePress={() => onDelete(item)} />
						</A11y.Index>
					</A11y.Order>
					<List.Separator />
				</Fragment>
			))}
		</View>
	);
};
