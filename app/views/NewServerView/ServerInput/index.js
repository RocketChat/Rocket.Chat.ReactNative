import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import TextInput from '../../../containers/TextInput';
import { themes } from '../../../constants/colors';
import Item from './Item';

const styles = StyleSheet.create({
	container: {
		zIndex: 1
	},
	inputContainer: {
		marginTop: 24,
		marginBottom: 32
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
		<View style={styles.container}>
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

ServerInput.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string,
	serversHistory: PropTypes.array,
	onChangeText: PropTypes.func,
	submit: PropTypes.func,
	deleteServerLink: PropTypes.func
};

export default ServerInput;
