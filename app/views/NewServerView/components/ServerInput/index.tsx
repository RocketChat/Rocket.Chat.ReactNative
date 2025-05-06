import React, { useState } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';
import { Control } from 'react-hook-form';

import { useTheme } from '../../../../theme';
import { ControlledFormTextInput } from '../../../../containers/TextInput';
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
	serversHistoryButton: {
		paddingVertical: 18
	}
});

interface IServerInput extends TextInputProps {
	error?: string;
	control: Control<
		{
			workspaceUrl: string;
		},
		any
	>;
	serversHistory: TServerHistoryModel[];
	onSubmit(): void;
	onDelete(item: TServerHistoryModel): void;
	onPressServerHistory(serverHistory: TServerHistoryModel): void;
}

const ServerInput = ({
	error,
	control,
	serversHistory,
	onChangeText,
	onSubmit,
	onDelete,
	onPressServerHistory
}: IServerInput): JSX.Element => {
	const [focused, setFocused] = useState(false);
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
				<ControlledFormTextInput
					name='workspaceUrl'
					control={control}
					label={I18n.t('Workspace_URL')}
					containerStyle={styles.inputContainer}
					inputStyle={error && !focused ? { borderColor: colors.fontDanger } : {}}
					returnKeyType='send'
					testID='new-server-view-input'
					onSubmitEditing={onSubmit}
					clearButtonMode='while-editing'
					keyboardType='url'
					textContentType='URL'
					required
					onChangeText={onChangeText}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					error={error}
				/>
			</View>
			{serversHistory?.length > 0 ? (
				<View style={styles.serversHistoryButton}>
					<Touch
						accessible
						accessibilityLabel={I18n.t('Open_servers_history')}
						testID='servers-history-button'
						onPress={openServersHistory}>
						<CustomIcon name='clock' size={32} color={colors.fontInfo} />
					</Touch>
				</View>
			) : null}
		</View>
	);
};

export default ServerInput;
