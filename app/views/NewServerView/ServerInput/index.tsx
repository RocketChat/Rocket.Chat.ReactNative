import React from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';

import { useTheme } from '../../../theme';
import { FormTextInput } from '../../../containers/TextInput';
import { TServerHistoryModel } from '../../../definitions';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../containers/CustomIcon';
import Touch from '../../../containers/Touch';

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

			<View style={{ width: 32, paddingVertical: 9 }}>
				<Touch>
					<CustomIcon name='clock' size={32} color={colors.fontInfo} />
				</Touch>
			</View>
		</View>
	);
};

export default ServerInput;
