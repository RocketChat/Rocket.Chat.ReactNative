import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import PropTypes from 'prop-types';

import TextInput from '../../containers/TextInput';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	inputContainer: {
		marginTop: 24,
		marginBottom: 32
	},
	item: {
		padding: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	itemText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	serverHistory: {
		maxHeight: 180,
		width: '100%',
		top: '75%',
		zIndex: 1,
		position: 'absolute',
		borderWidth: 0.5
	}
});

const Item = ({
	item, onPress, theme, deleteServerLink
}) => (
	<View style={styles.item}>
		<TouchableOpacity onPress={() => onPress(item.link)}>
			<Text style={[styles.itemText, { color: themes[theme].titleText }]}>{item.link}</Text>
		</TouchableOpacity>
		<TouchableOpacity onPress={() => deleteServerLink(item)}>
			<CustomIcon name='close' size={16} color={themes[theme].auxiliaryText} />
		</TouchableOpacity>
	</View>
);

Item.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string,
	onPress: PropTypes.func,
	deleteServerLink: PropTypes.func
};

const ServerInput = ({
	text,
	theme,
	serversHistory,
	onChangeText,
	submit,
	deleteServerLink
}) => {
	const [focused, setFocused] = useState(false);
	return (
		<View>
			<TextInput
				label='Enter workspace URL'
				placeholder='Ex. your-company.rocket.chat'
				containerStyle={styles.inputContainer}
				value={text}
				returnKeyType='send'
				onChangeText={onChangeText}
				testID='new-server-view-input'
				onSubmitEditing={submit}
				clearButtonMode='while-editing'
				keyboardType='url'
				textContentType='URL'
				theme={theme}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
			/>
			{
				focused
					? (
						<View style={[{ backgroundColor: themes[theme].backgroundColor, borderColor: themes[theme].separatorColor }, styles.serverHistory]}>
							<FlatList
								data={serversHistory}
								renderItem={({ item }) => <Item item={item} onPress={onChangeText} theme={theme} deleteServerLink={deleteServerLink} />}
								keyExtractor={item => item.id}
							/>
						</View>
					) : null
			}
		</View>
	);
};

export default ServerInput;
