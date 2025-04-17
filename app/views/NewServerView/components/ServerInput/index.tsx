import React, { useState } from 'react';
import { FlatList, StyleSheet, TextInputProps, View } from 'react-native';
import { Control } from 'react-hook-form';

import Item from './Item';
import { ControlledFormTextInput } from '../../../../containers/TextInput';
import * as List from '../../../../containers/List';
import I18n from '../../../../i18n';
import { TServerHistoryModel } from '../../../../definitions';
import { useTheme } from '../../../../theme';

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
	error?: string;
	control: Control<
		{
			workspaceUrl: string;
		},
		any
	>;
	serversHistory: any[];
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
	const { colors } = useTheme();
	const [focused, setFocused] = useState(false);
	return (
		<View style={styles.container}>
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
		</View>
	);
};

export default ServerInput;
