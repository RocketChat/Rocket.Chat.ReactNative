import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { A11y } from 'react-native-a11y-order';

import * as List from '../../../../containers/List';
import { useTheme } from '../../../../theme';
import { type TServerHistoryModel } from '../../../../definitions';
import ServersHistoryItem from '../ServersHistoryItem';
import I18n from '../../../../i18n';
import sharedStyles from '../../../Styles';


const styles = StyleSheet.create({
	header: {
		height: 41,
		borderBottomWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	headerText: {
		fontSize: 16,
		marginLeft: 12,
		...sharedStyles.textRegular
	}
});
  
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
		<View style={{ paddingBottom: bottom, backgroundColor: colors.surfaceLight }}>
			<View style={[styles.header, { borderColor: colors.strokeLight }]}>
				<Text style={[styles.headerText, { color: colors.fontSecondaryInfo }]}>{I18n.t('Workspaces')}</Text>
			</View>
			<List.Separator />
			{serversHistory.map(item => (
				<React.Fragment key={item.id}>
					<A11y.Order>
						<A11y.Index index={1}>
							<ServersHistoryItem item={item} onPress={() => onPressServerHistory(item)} onDeletePress={() => onDelete(item)} />
						</A11y.Index>
					</A11y.Order>
					<List.Separator />
				</React.Fragment>
			))}
		</View>
	);
};
