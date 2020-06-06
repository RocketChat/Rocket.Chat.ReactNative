import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Keyboard } from 'react-native';
import PropTypes from 'prop-types';
import Animated from 'react-native-reanimated';

import sharedStyles from '../../views/Styles';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import Recording from './Recording';
import { themes } from '../../constants/colors';
import styles from './styles';
import TextInput from '../../presentation/TextInput';
import debounce from '../../utils/debounce';

const TOP = 0;
const BOTTOM = Dimensions.get('window').height;
const stylez = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 0,
		left: 0,
		height: '100%',
	},
	input: {
		textAlignVertical: 'top',
		// paddingVertical: 12, needs to be paddingTop/paddingBottom because of iOS/Android's TextInput differences on rendering
		padding: 15,
		fontSize: 17,
		letterSpacing: 0,
		...sharedStyles.textRegular,
		height: '90%'
	},
	buttons: {
		zIndex: 5,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	rightButtons: {
		flexDirection: 'row'
	},
	topButton: {
		width: '100%',
		backgroundColor: 'red',
		padding: '1%'
	}
});


const MessageBox = React.memo(({ editing, message, replying, replyCancel, user, getCustomEmoji, theme, Message_AudioRecorderEnabled }) => {
	const [text, setText] = useState('');
	const [up, setUp] = useState(1);
	const [bottomCoefficient, setBottomCoefficient] = useState(0.77);
	const translateY = up ? TOP : BOTTOM;
	const [mentions, setMentions] = useState([]);
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
	const [showSend, setShowSend] = useState(false);
	const [recording, setRecording] = useState(false);
	const [trackingType, setTrackingType] = useState('');
	const [file, setFile] = useState({
		isVisible: false
	});
	const [commandPreview, setComandPreview] = useState([]);
	const [showCommandPreview, setShowCommandPreview] = useState(false);
	const [command, setCommand] = useState({});
	const component = useRef()

	function onChangeText(text) {
		const isTextEmpty = text.length === 0;
		if (!isTextEmpty !== showSend) {
			setShowSend(!isTextEmpty);
		}
		//debouncedOnChangeText(text);
		setInput(text);
	};

	function setInput(text) {
		setText(text);
		if (component && component.setNativeProps) {
			component.setNativeProps({ text });
		}
	};

	function renderTopButton() {
		return <TouchableOpacity onPress={() => setUp(!up)} style={stylez.topButton} />
	}

	/* 	const debouncedOnChangeText = debounce(async(text) => {
			const db = database.active;
			const isTextEmpty = text.length === 0;
			// this.setShowSend(!isTextEmpty);
			this.handleTyping(!isTextEmpty);
			// matches if their is text that stats with '/' and group the command and params so we can use it "/command params"
			const slashCommand = text.match(/^\/([a-z0-9._-]+) (.+)/im);
			if (slashCommand) {
				const [, name, params] = slashCommand;
				const commandsCollection = db.collections.get('slash_commands');
				try {
					const command = await commandsCollection.find(name);
					if (command.providesPreview) {
						return this.setCommandPreview(command, name, params);
					}
				} catch (e) {
					console.log('Slash command not found');
				}
			}
	
			if (!isTextEmpty) {
				try {
					const { start, end } = this.component?.lastNativeSelection;
					const cursor = Math.max(start, end);
					const lastNativeText = this.component?.lastNativeText || '';
					// matches if text either starts with '/' or have (@,#,:) then it groups whatever comes next of mention type
					const regexp = /(#|@|:|^\/)([a-z0-9._-]+)$/im;
					const result = lastNativeText.substr(0, cursor).match(regexp);
					if (!result) {
						const slash = lastNativeText.match(/^\/$/); // matches only '/' in input
						if (slash) {
							return this.identifyMentionKeyword('', MENTIONS_TRACKING_TYPE_COMMANDS);
						}
						return this.stopTrackingMention();
					}
					const [, lastChar, name] = result;
					this.identifyMentionKeyword(name, lastChar);
				} catch (e) {
					log(e);
				}
			} else {
				this.stopTrackingMention();
			}
		}, 100) */

	function renderContent() {
		const isAndroidTablet = isTablet && isAndroid ? {
			multiline: false,
			onSubmitEditing: () => { },
			returnKeyType: 'send'
		} : {};

		if (recording) {
			return <Recording theme={theme} onFinish={() => { }} />;
		}
		return (
			<>
				<View style={[styles.composer, { borderTopColor: themes[theme].separatorColor }]}>
					{renderTopButton()}
					<View
						style={[
							styles.textArea,
							{ backgroundColor: themes[theme].messageboxBackground }, editing && { backgroundColor: themes[theme].chatComponentBackground }
						]}
						testID='messagebox'
					>
						<LeftButtons
							theme={theme}
							showEmojiKeyboard={false}
							editing={false}
							showMessageBoxActions={() => { }}
							editCancel={() => { }}
							openEmoji={() => { }}
							closeEmoji={() => { }}
						/>
						<TextInput
							ref={component}
							style={styles.textBoxInput}
							returnKeyType='default'
							keyboardType='twitter'
							blurOnSubmit={false}
							placeholder={'New_Message'}
							onChangeText={onChangeText}
							underlineColorAndroid='transparent'
							defaultValue=''
							multiline
							testID='messagebox-input'
							theme={theme}
							{...isAndroidTablet}
						/>
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
	}

	return (
		<>
			<Animated.View style={[stylez.container, { transform: [{ translateY }] }]}>
				{renderTopButton()}
				<TextInput
					ref={component}
					style={[stylez.input, { backgroundColor: themes[theme].chatComponentBackground }]}
					returnKeyType='default'
					keyboardType='twitter'
					blurOnSubmit={false}
					placeholder={'New Message'}
					onChangeText={onChangeText}
					underlineColorAndroid='transparent'
					defaultValue=''
					multiline
					testID='messagebox-input'
					theme={theme}
					autoGrow={false}
				/>
			</Animated.View>
			{
				up ?
					<View style={[stylez.buttons, { backgroundColor: themes[theme].chatComponentBackground }]}>
						<LeftButtons
							theme={theme}
							showEmojiKeyboard={false}
							editing={false}
							showMessageBoxActions={() => { }}
							editCancel={() => { }}
							openEmoji={() => { }}
							closeEmoji={() => { }}
						/>
						<View style={stylez.rightButtons}>
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
					: renderContent()
			}
		</>
	);
});

MessageBox.propTypes = {
	message: PropTypes.object,
	replying: PropTypes.bool,
	editing: PropTypes.bool,
	user: PropTypes.shape({
		id: PropTypes.string,
		username: PropTypes.string,
		token: PropTypes.string
	}),
	Message_AudioRecorderEnabled: PropTypes.bool,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string,
	replyCancel: PropTypes.func,
};

export default MessageBox;
