import React from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';

import { useTheme } from '../../../../theme';
import { FormTextInput } from '../../../../containers/TextInput';
import { TServerHistoryModel } from '../../../../definitions';
import I18n from '../../../../i18n';
import { CustomIcon } from '../../../../containers/CustomIcon';
import { showActionSheetRef, hideActionSheetRef } from '../../../../containers/ActionSheet';
import Touch from '../../../../containers/Touch';
import { ServersHistoryActionSheetContent } from '../ServersHistoryActionSheetContent';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 4
	},
	inputContainer: {
		flex: 1
	},
	input: {
		marginTop: 0,
		marginBottom: 0
	},
	serversHistoryButton: {
		width: 32,
		paddingVertical: 9
	}
});

interface IServerInput extends TextInputProps {
	text: string;
	serversHistory: TServerHistoryModel[];
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

	const handleSelectServer = (item: TServerHistoryModel) => {
		onPressServerHistory(item);
		hideActionSheetRef();
	};

	const openServersHistory = () => {
		showActionSheetRef({
			children: (
				<ServersHistoryActionSheetContent
					serversHistory={serversHistory}
					onDelete={handleDeleteServerHistory}
					onPressServerHistory={handleSelectServer}
				/>
			)
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.inputContainer}>
				<FormTextInput
					label={I18n.t('Workspace_URL')}
					containerStyle={styles.input}
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
				<View style={styles.serversHistoryButton}>
					<Touch testID='servers-history-button' onPress={openServersHistory}>
						<CustomIcon name='clock' size={32} color={colors.fontInfo} />
					</Touch>
				</View>
			) : null}
		</View>
	);
};

export default ServerInput;
