import React, { useState } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';

import sharedStyles from '../../views/Styles';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';

const TOP = 0;
const BOTTOM = 450;
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
	const [up, setUp] = useState(true);
	const translateY = up ? TOP : BOTTOM;

	return (
		<>
			<TextInput
				style={[styles.input, { transform: [{ translateY }] }]}
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
					openEmoji={() => { setUp(!up); }}
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
