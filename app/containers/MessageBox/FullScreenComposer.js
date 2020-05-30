import React, { useState } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { onGestureEvent, withSpring } from 'react-native-redash';

import sharedStyles from '../../views/Styles';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';

const { Value } = Animated;
const { UNDETERMINED } = State;
const TOP = 0;
const BOTTOM = 450;
const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		right: 0,
		left: 0,
		height: '100%',
		paddingTop: 20,
		backgroundColor: 'red'
	},
	input: {
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


const MessageBox = React.memo(({ theme }) => {
	const [text, setText] = useState();
	const translationY = new Value(0);
	const velocityY = new Value(0);
	const offset = new Value(0)
	const state = new Value(UNDETERMINED);
	const gestureHandler = onGestureEvent({
		translationY,
		state,
		velocityY
	});
	const translateY = withSpring({
		state,
		offset,
		value: translationY,
		velocity: velocityY,
		snapPoints: [TOP, BOTTOM]
	});
	/* const translateY = translationY; */
	return (
		<>
			<PanGestureHandler {...gestureHandler}>
				<Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
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
				</Animated.View>
			</PanGestureHandler>
			<View style={styles.buttons}>
				<LeftButtons
					theme={theme}
					showEmojiKeyboard={false}
					editing={false}
					showMessageBoxActions={() => { }}
					editCancel={() => { }}
					openEmoji={() => { }}
					closeEmoji={() => { }}
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
});

MessageBox.propTypes = {
	theme: PropTypes.string
};

export default MessageBox;
