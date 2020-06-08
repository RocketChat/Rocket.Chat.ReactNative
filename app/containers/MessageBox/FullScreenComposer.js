import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Keyboard } from 'react-native';
import PropTypes from 'prop-types';
import Animated from 'react-native-reanimated';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import sharedStyles from '../../views/Styles';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import Recording from './Recording';
import { themes } from '../../constants/colors';
import styles from './styles';
import TextInput from '../../presentation/TextInput';
import debounce from '../../utils/debounce';
import Mentions from './Mentions';
import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import {
	MENTIONS_TRACKING_TYPE_EMOJIS,
	MENTIONS_TRACKING_TYPE_COMMANDS,
	MENTIONS_COUNT_TO_DISPLAY,
	MENTIONS_TRACKING_TYPE_USERS
} from './constants';
import RocketChat from '../../lib/rocketchat';
import { userTyping as userTypingAction } from '../../actions/room';
import MessageboxContext from './Context';
import { generateTriggerId } from '../../lib/methods/actions';
import log from '../../utils/log';
import CommandsPreview from './CommandsPreview';

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


const MessageBox = React.memo(({ editing, message, replying, replyCancel, user, getCustomEmoji, theme, Message_AudioRecorderEnabled, typing, rid, baseUrl }) => {
	const [text, setText] = useState('');
	const [up, setUp] = useState(0);
	const translateY = up ? TOP : BOTTOM;
	const [mentions, setMentions] = useState([]);
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
	const [showSend, setStateShowSend] = useState(false);
	const [recording, setRecording] = useState(false);
	const [trackingType, setTrackingType] = useState('');
	const [file, setFile] = useState({
		isVisible: false
	});
	const [commandPreview, setStateComandPreview] = useState([]);
	const [showCommandPreview, setShowCommandPreview] = useState(false);
	const [command, setCommand] = useState({});
	const [typingTimeout, setTypingTimeout] = useState(false);
	const component = useRef()

	function setInput(text) {
		setText(text);
		if (component && component.current?.setNativeProps) {
			component.current?.setNativeProps({ text });
		}
	}

	function setShowSend (nextShowSend) {
		if (nextShowSend !== showSend) {
			setShowSend(nextShowSend);
		}
	}

	function clearInput () {
		setInput('');
		setShowSend(false);
	}

	function onChangeText(text) {
		const isTextEmpty = text.length === 0;
		setShowSend(!isTextEmpty);
		debouncedOnChangeText(text);
		setInput(text);
	}

	function setShowSend(nextShowSend) {
		if (nextShowSend !== showSend) {
			setStateShowSend(nextShowSend);
		}
	}

	function focus () {
		if (component && component.current?.focus) {
			component.current?.focus();
		}
	}

	function handleTyping(isTyping) {
		if (!isTyping) {
			if (typingTimeout) {
				clearTimeout(typingTimeout);
				setTypingTimeout(false);
			}
			typing(rid, false);
			return;
		}

		if (typingTimeout) {
			return;
		}

		setTypingTimeout(setTimeout(() => {
			typing(rid, true);
			setTypingTimeout(false);
		}, 1000));
	}

	function getFixedMentions(keyword) {
		let result = [];
		if ('all'.indexOf(keyword) !== -1) {
			result = [{ id: -1, username: 'all' }];
		}
		if ('here'.indexOf(keyword) !== -1) {
			result = [{ id: -2, username: 'here' }, ...result];
		}
		return result;
	}

	const getUsers = debounce(async (keyword) => {
		let res = await RocketChat.search({ text: keyword, filterRooms: false, filterUsers: true });
		res = [...getFixedMentions(keyword), ...res];
		setMentions(res);
	}, 300)

	const getRooms = debounce(async (keyword = '') => {
		const res = await RocketChat.search({ text: keyword, filterRooms: true, filterUsers: false });
		setMentions(res);
	}, 300)

	const getEmojis = debounce(async (keyword) => {
		const db = database.active;
		if (keyword) {
			const customEmojisCollection = db.collections.get('custom_emojis');
			let customEmojis = await customEmojisCollection.query(
				Q.where('name', Q.like(`${Q.sanitizeLikeString(keyword)}%`))
			).fetch();
			customEmojis = customEmojis.slice(0, MENTIONS_COUNT_TO_DISPLAY);
			const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
			const mergedEmojis = [...customEmojis, ...filteredEmojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
			setMentions(mergedEmojis || []);
		}
	}, 300)

	const getSlashCommands = debounce(async (keyword) => {
		const db = database.active;
		const commandsCollection = db.collections.get('slash_commands');
		const commands = await commandsCollection.query(
			Q.where('id', Q.like(`${Q.sanitizeLikeString(keyword)}%`))
		).fetch();
		setMentions(commands || []);
	}, 300)

	async function setCommandPreview(command, name, params) {
		try {
			const { preview } = await RocketChat.getCommandPreview(name, rid, params);
			setStateCommandPreview(preview.items);
			setShowCommandPreview(true);
			setCommand(command);
		} catch (e) {
			setStateCommandPreview([]);
			setShowCommandPreview(true);
			setCommand({});
			log(e);
		}
	}

	function stopTrackingMention() {
		if (!trackingType && !showCommandPreview) {
			return;
		}
		setMentions([]);
		setTrackingType('');
		setCommandPreview([]);
		setShowCommandPreview(false);
	}

	function updateMentions(keyword, type) {
		if (type === MENTIONS_TRACKING_TYPE_USERS) {
			getUsers(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_EMOJIS) {
			getEmojis(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_COMMANDS) {
			getSlashCommands(keyword);
		} else {
			getRooms(keyword);
		}
	}

	function identifyMentionKeyword(keyword, type) {
		setShowEmojiKeyboard(false);
		setTrackingType(type);
		updateMentions(keyword, type);
	}

	const debouncedOnChangeText = debounce(async (text) => {
		const db = database.active;
		const isTextEmpty = text.length === 0;
		// this.setShowSend(!isTextEmpty);
		handleTyping(!isTextEmpty);
		// matches if their is text that stats with '/' and group the command and params so we can use it "/command params"
		const slashCommand = text.match(/^\/([a-z0-9._-]+) (.+)/im);
		if (slashCommand) {
			const [, name, params] = slashCommand;
			const commandsCollection = db.collections.get('slash_commands');
			try {
				const command = await commandsCollection.find(name);
				if (command.providesPreview) {
					return setCommandPreview(command, name, params);
				}
			} catch (e) {
				console.log('Slash command not found');
			}
		}

		if (!isTextEmpty) {
			try {
				const { start, end } = component.current?.lastNativeSelection;
				const cursor = Math.max(start, end);
				const lastNativeText = component.current?.lastNativeText || '';
				// matches if text either starts with '/' or have (@,#,:) then it groups whatever comes next of mention type
				const regexp = /(#|@|:|^\/)([a-z0-9._-]+)$/im;
				const result = lastNativeText.substr(0, cursor).match(regexp);
				if (!result) {
					const slash = lastNativeText.match(/^\/$/); // matches only '/' in input
					if (slash) {
						return identifyMentionKeyword('', MENTIONS_TRACKING_TYPE_COMMANDS);
					}
					return stopTrackingMention();
				}
				const [, lastChar, name] = result;
				identifyMentionKeyword(name, lastChar);
			} catch (e) {
				log(e);
			}
		} else {
			stopTrackingMention();
		}
	}, 100)

	function onPressMention (item) {
		if (!component.current) {
			return;
		}
		const msg = text;
		const { start, end } = component.current?.lastNativeSelection;
		const cursor = Math.max(start, end);
		const regexp = /([a-z0-9._-]+)$/im;
		const result = msg.substr(0, cursor).replace(regexp, '');
		const mentionName = trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
			? `${ item.name || item }:`
			: (item.username || item.name || item.command);
		const newText = `${ result }${ mentionName } ${ msg.slice(cursor) }`;
		if ((trackingType === MENTIONS_TRACKING_TYPE_COMMANDS) && item.providesPreview) {
			setShowCommandPreview(true);
		}
		setInput(newText);
		focus();
		requestAnimationFrame(() => stopTrackingMention());
	}

	function onPressCommandPreview (item) {
		const { id: messageTmid } = message;
		const name = text.substr(0, text.indexOf(' ')).slice(1);
		const params = text.substr(text.indexOf(' ') + 1) || 'params';
		setStateCommandPreview([]);
		setShowCommandPreview(false);
		setCommand({});
		stopTrackingMention();
		clearInput();
		handleTyping(false);
		try {
			const { appId } = command;
			const triggerId = generateTriggerId(appId);
			RocketChat.executeCommandPreview(name, params, rid, item, triggerId, tmid || messageTmid);
			replyCancel();
		} catch (e) {
			log(e);
		}
	}

	function renderTopButton() {
		return <TouchableOpacity onPress={() => setUp(!up)} style={stylez.topButton} />
	}

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
							defaultValue={text}
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
			<MessageboxContext.Provider
				value={{
					user,
					baseUrl,
					onPressMention: onPressMention,
					onPressCommandPreview: onPressCommandPreview
				}}
			>

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
						defaultValue={text}
						multiline
						testID='messagebox-input'
						theme={theme}
						autoGrow={false}
					/>
				</Animated.View>
				<CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
				<Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
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
			</MessageboxContext.Provider>
		</>
	);
});

MessageBox.propTypes = {
	baseUrl: PropTypes.string.isRequired,
	rid: PropTypes.string.isRequired,
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
	typing: PropTypes.func,
};

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	threadsEnabled: state.settings.Threads_enabled,
	user: getUserSelector(state),
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize,
	Message_AudioRecorderEnabled: state.settings.Message_AudioRecorderEnabled
});

const dispatchToProps = ({
	typing: (rid, status) => userTypingAction(rid, status)
});

export default connect(mapStateToProps, dispatchToProps, null, { forwardRef: true })(MessageBox);
