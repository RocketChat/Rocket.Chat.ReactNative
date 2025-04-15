import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInputProps, View } from 'react-native';
import { Control } from 'react-hook-form';

import Item from './Item';
import { ControlledFormTextInput } from '../../../../containers/TextInput';
import * as List from '../../../../containers/List';
import I18n from '../../../../i18n';
import { TServerHistoryModel } from '../../../../definitions';
import { useTheme } from '../../../../theme';
import { CustomIcon } from '../../../../containers/CustomIcon';

const styles = StyleSheet.create({
	container: {
		zIndex: 1
	},
	inputContainer: {
		marginTop: 0,
		marginBottom: 0
	},
	serverHistory: {
		maxHeight: 180,
		width: '100%',
		top: '100%',
		zIndex: 1,
		position: 'absolute',
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 4,
		borderTopWidth: 0
	}
});

interface IServerInput extends TextInputProps {
	showError: boolean;
	control: Control<
		{
			workspaceUrl: string;
		},
		any
	>;
	text: string;
	serversHistory: any[];
	onSubmit(): void;
	onDelete(item: TServerHistoryModel): void;
	onPressServerHistory(serverHistory: TServerHistoryModel): void;
}

const ServerInput = ({
	showError,
	control,
	text,
	serversHistory,
	onChangeText,
	onSubmit,
	onDelete,
	onPressServerHistory
}: IServerInput): JSX.Element => {
	const { colors } = useTheme();
	const [focused, setFocused] = useState(false);
	return (
		<View style={styles.container}>
			<ControlledFormTextInput
				name='workspaceUrl'
				control={control}
				label={I18n.t('Workspace_URL')}
				containerStyle={styles.inputContainer}
				inputStyle={showError ? { borderColor: colors.fontDanger } : {}}
				value={text}
				returnKeyType='send'
				onChangeText={onChangeText}
				testID='new-server-view-input'
				onSubmitEditing={onSubmit}
				clearButtonMode='while-editing'
				keyboardType='url'
				textContentType='URL'
				required
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
			/>

			{focused && serversHistory?.length ? (
				<View style={[styles.serverHistory, { backgroundColor: colors.surfaceRoom, borderColor: colors.strokeLight }]}>
					<FlatList
						data={serversHistory}
						renderItem={({ item }) => <Item item={item} onPress={() => onPressServerHistory(item)} onDelete={onDelete} />}
						ItemSeparatorComponent={List.Separator}
						keyExtractor={item => item.id}
					/>
				</View>
			) : null}

			{showError && (
				<View style={{ flexDirection: 'row', gap: 4, paddingVertical: 4 }}>
					<CustomIcon name='warning' size={16} color={colors.fontDanger} />
					<Text style={{ fontSize: 14, color: colors.fontDanger }}>Invalid URL</Text>
				</View>
			)}
		</View>
	);
};

export default ServerInput;
