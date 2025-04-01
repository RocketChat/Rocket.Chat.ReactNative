import React from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';

import { useTheme } from '../../../theme';
import { FormTextInput } from '../../../containers/TextInput';
import { TServerHistoryModel } from '../../../definitions';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../containers/CustomIcon';
import Touch from '../../../containers/Touch';
import { showActionSheetRef, hideActionSheetRef } from '../../../containers/ActionSheet';
import * as List from '../../../containers/List';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 4
	},
	inputContainer: {
		marginTop: 0,
		marginBottom: 0
	}
});

interface IServerInput extends TextInputProps {
	text: string;
	serversHistory: any[];
	onSubmit(): void;
	onDelete(item: TServerHistoryModel): void;
	onPressServerHistory(serverHistory: TServerHistoryModel): void;
}

const ServerInput = ({
	text,
	serversHistory,
	onChangeText,
	onSubmit,
	onDelete,
	onPressServerHistory
}: IServerInput): JSX.Element => {
	const { colors } = useTheme();

	const handleDeleteServerHistory = (item: TServerHistoryModel) => {
		onDelete(item);
		hideActionSheetRef();
	};

	const openServersHistory = () => {
		showActionSheetRef({
			children: (
				<View style={{ paddingBottom: 20 }}>
					<List.Container>
						<List.Separator />
						<>
							{serversHistory.map(item => (
								<>
									<List.Item
										onPress={() => onPressServerHistory(item)}
										right={() => (
											<Touch onPress={() => handleDeleteServerHistory(item)}>
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
			)
		});
	};
	return (
		<View style={styles.container}>
			<View style={{ flex: 1 }}>
				<FormTextInput
					label={I18n.t('Workspace_URL')}
					containerStyle={styles.inputContainer}
					value={text}
					returnKeyType='send'
					onChangeText={onChangeText}
					testID='new-server-view-input'
					onSubmitEditing={onSubmit}
					clearButtonMode='while-editing'
					keyboardType='url'
					textContentType='URL'
					required
				/>
			</View>

			{serversHistory?.length > 0 ? (
				<View style={{ width: 32, paddingVertical: 9 }}>
					<Touch onPress={openServersHistory}>
						<CustomIcon name='clock' size={32} color={colors.fontInfo} />
					</Touch>
				</View>
			) : null}
		</View>
	);
};

export default ServerInput;
