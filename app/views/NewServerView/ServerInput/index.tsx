import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';
import { Q } from '@nozbe/watermelondb';

import { sanitizeLikeString } from '../../../lib/database/utils';
import database from '../../../lib/database';
import { FormTextInput } from '../../../containers/TextInput';
import { Separator } from '../../../containers/List';
import { themes } from '../../../lib/constants';
import I18n from '../../../i18n';
import { TServersHistoryModel } from '../../../definitions';
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
	serversHistory: {
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

interface IServerInputProps extends TextInputProps {
	text: string;
	theme: TSupportedThemes;
	onChangeText: (text: string) => void;
	onSubmit(): void;
	onPressServersHistory(serversHistory: TServersHistoryModel): void;
}

const ServerInput = ({ text, theme, onChangeText, onSubmit, onPressServersHistory }: IServerInputProps): JSX.Element => {
	const [focused, setFocused] = useState(false);
	const [serversHistory, setServersHistory] = useState([] as TServersHistoryModel[]);

	useEffect(() => {
		queryServersHistory('');
	}, []);

	const queryServersHistory = async (textFilter: string) => {
		const MAX_NUMBER_SERVERS = 3;
		const db = database.servers;
		try {
			const serversHistoryCollection = db.get('servers_history');
			let whereClause = [
				Q.where('username', Q.notEq(null)),
				Q.experimentalSortBy('updated_at', Q.desc),
				Q.experimentalTake(MAX_NUMBER_SERVERS)
			];
			if (textFilter) {
				const likeString = sanitizeLikeString(textFilter);
				whereClause = [...whereClause, Q.where('url', Q.like(`%${likeString}%`))];
			}
			const serversHistory = await serversHistoryCollection.query(...whereClause).fetch();
			setServersHistory(serversHistory);
		} catch {
			// Do nothing
		}
	};

	const internalOnChangeText = (newText: string) => {
		queryServersHistory(newText);
		onChangeText(newText);
	};

	const deleteServersHistory = async (item: TServersHistoryModel) => {
		const db = database.servers;
		try {
			await db.write(async () => {
				await item.destroyPermanently();
			});
			setServersHistory(previousServersHistory => previousServersHistory.filter(server => server.id !== item.id));
		} catch {
			// Nothing
		}
	};

	return (
		<View style={styles.container}>
			<FormTextInput
				label={I18n.t('Enter_workspace_URL')}
				placeholder={I18n.t('Workspace_URL_Example')}
				containerStyle={styles.inputContainer}
				value={text}
				returnKeyType='send'
				onChangeText={internalOnChangeText}
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
						styles.serversHistory,
						{ backgroundColor: themes[theme].backgroundColor, borderColor: themes[theme].separatorColor }
					]}
				>
					{serversHistory.map((item, index) => (
						<View key={item.id}>
							<Item item={item} theme={theme} onPress={() => onPressServersHistory(item)} onDelete={deleteServersHistory} />
							{index < serversHistory.length && <Separator /> /* Don't display <Separator /> below last item. */}
						</View>
					))}
				</View>
			) : null}
		</View>
	);
};

export default ServerInput;
