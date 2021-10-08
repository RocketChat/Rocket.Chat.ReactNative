import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import TextInput from '../../../containers/TextInput';
import * as List from '../../../containers/List';
import { themes } from '../../../constants/colors';
import Item from './Item';
import I18n from '../../../i18n';

const styles = StyleSheet.create({
	container: {
		zIndex: 1,
		marginTop: 24,
		marginBottom: 32
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
		borderRadius: 2,
		borderTopWidth: 0
	}
});

const ServerInput = ({
	text,
	theme,
	serversHistory,
	onChangeText,
	onSubmit,
	onDelete,
	onPressServerHistory
}) => {
	const [focused, setFocused] = useState(false);
	return (
		<View style={styles.container}>
			<TextInput
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
				theme={theme}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
			/>
			{
				focused && serversHistory?.length
					? (
						<View style={[styles.serverHistory, { backgroundColor: themes[theme].backgroundColor, borderColor: themes[theme].separatorColor }]}>
							<FlatList
								data={serversHistory}
								renderItem={({ item }) => <Item item={item} theme={theme} onPress={() => onPressServerHistory(item)} onDelete={onDelete} />}
								ItemSeparatorComponent={List.Separator}
								keyExtractor={item => item.id}
							/>
						</View>
					) : null
			}
		</View>
	);
};

ServerInput.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string,
	serversHistory: PropTypes.array,
	onChangeText: PropTypes.func,
	onSubmit: PropTypes.func,
	onDelete: PropTypes.func,
	onPressServerHistory: PropTypes.func
};

export default ServerInput;
