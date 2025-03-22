import React, { useState } from 'react';
import { FlatList, StyleSheet, TextInputProps, View } from 'react-native';

import { useTheme } from '../../../theme';
import { FormTextInput } from '../../../containers/TextInput';
import { TServerHistoryModel } from '../../../definitions';
import * as List from '../../../containers/List';
import I18n from '../../../i18n';
import Item from './Item';

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
	const [focused, setFocused] = useState(false);
	const { colors } = useTheme();
	return (
		<View style={styles.container}>
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
		</View>
	);
};

export default ServerInput;
