import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';

import sharedStyles from '../../views/Styles';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';


const styles = StyleSheet.create({
	input: {
		position: 'absolute',
		top: 0,
		right: 0,
		left: 0,
		bottom: 0,
		textAlignVertical: 'top',
		// paddingVertical: 12, needs to be paddingTop/paddingBottom because of iOS/Android's TextInput differences on rendering
		padding: 15,
		fontSize: 17,
		letterSpacing: 0,
		...sharedStyles.textRegular,
		backgroundColor: 'white',
		height: '100%'
	},
	buttons: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	rightButtons: {
		flexDirection: 'row'
	}
});


const MessageBox = ({ theme }) => {
	const [text, setText] = useState();

	useEffect(() => {
		console.log(text);
	}, [text]);

	return (
		<>
			<TextInput
				style={styles.input}
				multiline
				placeholder='New message'
				value={text}
				onChangeText={setText}
				returnKeyType='default'
				keyboardType='twitter'
				blurOnSubmit={false}
				underlineColorAndroid='transparent'
				defaultValue=''
			/>
			<View style={styles.buttons}>
				<LeftButtons
					theme={theme}
					showEmojiKeyboard={false}
					editing={false}
					showMessageBoxActions={() => {}}
					editCancel={() => {}}
					openEmoji={() => {}}
					closeEmoji={() => {}}
				/>
				<View style={styles.rightButtons}>
					<RightButtons
						theme={theme}
						showSend={false}
						submit={() => { }}
						recordAudioMessage={() => { }}
						recordAudioMessageEnabled={() => { }}
						showMessageBoxActions={() => { }}
					/>
				</View>
			</View>
		</>
	);
};

MessageBox.propTypes = {
	theme: PropTypes.string
};

export default MessageBox;
