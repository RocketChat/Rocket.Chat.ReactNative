import React, { useState } from 'react';
import { FlatList, StyleSheet, TextInputProps, View } from 'react-native';

import { FormTextInput } from '../../../containers/TextInput';
import * as List from '../../../containers/List';
import { themes } from '../../../lib/constants';
import I18n from '../../../i18n';
import { TServerHistoryModel } from '../../../definitions';
import Item from './Item';
import { TSupportedThemes } from '../../../theme';

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
	theme: TSupportedThemes;
	serversHistory: any[];
	onSubmit(): void;
	onDelete(item: TServerHistoryModel): void;
	onPressServerHistory(serverHistory: TServerHistoryModel): void;
}

const ServerInput = ({
	text,
	theme,
	serversHistory,
	onChangeText,
	onSubmit,
	onDelete,
	onPressServerHistory
}: IServerInput): JSX.Element => {
	const [focused, setFocused] = useState(false);
	return (
		<View style={styles.container}>
			<FormTextInput
				label={I18n.t('Enter_workspace_URL')}
				placeholder={I18n.t('Workspace_URL_Example')}
				containerStyle={styles.inputContainer}
				value={text}
				returnKeyType='send'
				onChangeText={onChangeText}
				testID='new-server-view-input'
				onSubmitEditing={onSubmit}
				clearButtonMode='while-editing'
				keyboardType='url'
				textContentType='URL'
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
			/>
			{focused && serversHistory?.length ? (
				<View
					style={[
						styles.serverHistory,
						{ backgroundColor: themes[theme].backgroundColor, borderColor: themes[theme].separatorColor }
					]}
				>
					<FlatList
						data={serversHistory}
						renderItem={({ item }) => (
							<Item item={item} theme={theme} onPress={() => onPressServerHistory(item)} onDelete={onDelete} />
						)}
						ItemSeparatorComponent={List.Separator}
						keyExtractor={item => item.id}
					/>
				</View>
			) : null}
		</View>
	);
};

export default ServerInput;
