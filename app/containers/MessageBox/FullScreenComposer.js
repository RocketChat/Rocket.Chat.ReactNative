import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, TouchableOpacity, Keyboard
} from 'react-native';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
import Modal from 'react-native-modal';
import equal from 'deep-equal';

import TextInput from '../../presentation/TextInput';
import styles from './styles';
import RecordAudio from './RecordAudio';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';
import { themes } from '../../constants/colors';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import Mentions from './Mentions';
import CommandsPreview from './CommandsPreview';
import { CustomIcon } from '../../lib/Icons';

const ANIMATIONTIME = 300;

class FullScreenComposer extends Component {
	static PropTypes = {
		closeEmoji: PropTypes.func,
		commandPreview: PropTypes.array,
		editing: PropTypes.bool,
		editCancel: PropTypes.func,
		finishAudioMessage: PropTypes.func,
		getCustomEmoji: PropTypes.func,
		iOSScrollBehavior: PropTypes.number,
		isActionsEnabled: PropTypes.bool,
		isFullScreen: PropTypes.bool,
		mentions: PropTypes.array,
		message: PropTypes.object,
		Message_AudioRecorderEnabled: PropTypes.bool,
		onChangeText: PropTypes.func,
		onEmojiSelected: PropTypes.func,
		onKeyboardResigned: PropTypes.func,
		openEmoji: PropTypes.func,
		recording: PropTypes.bool,
		recordingCallback: PropTypes.func,
		replying: PropTypes.bool,
		replyCancel: PropTypes.func,
		showSend: PropTypes.bool,
		showEmojiKeyboard: PropTypes.bool,
		showCommandPreview: PropTypes.bool,
		showMessageBoxActions: PropTypes.func,
		submit: PropTypes.func,
		text: PropTypes.string,
		toggleRecordAudioWithState: PropTypes.func,
		theme: PropTypes.string,
		toggleFullScreen: PropTypes.func,
		trackingType: PropTypes.array,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		innerRef: PropTypes.object
	};

	constructor(props){
		super(props);
		this.state = {};
	}

	shouldComponentUpdate(nextProps) {
		const {
			theme,
			replying, 
			editing, 
			showEmojiKeyboard,
			showSend, 
			recording, 
			mentions, 
			commandPreview,
			message, 
		} = this.props;

		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.replying !== replying) {
			return true;
		}
		if (nextProps.editing !== editing) {
			return true;
		}
		if (nextProps.showEmojiKeyboard !== showEmojiKeyboard) {
			return true;
		}
		if (nextProps.showSend !== showSend) {
			return true;
		}
		if (nextProps.recording !== recording) {
			return true;
		}
		if (!equal(nextProps.mentions, mentions)) {
			return true;
		}
		if (!equal(nextProps.commandPreview, commandPreview)) {
			return true;
		}
		if (!equal(nextProps.message, message)) {
			return true;
		}
		if (!equal(nextProps.message, message)) {
			return true;
		}
		return false;
	}

	closeModal = () => {
		const { toggleFullScreen } = this.props;
		Keyboard.dismiss();
		toggleFullScreen();
	}

	startRecordingAudio = () => {
		const { toggleRecordAudioWithState } = this.props;
		toggleRecordAudioWithState();
		this.closeModal();
	}

	renderFullScreenBottomBar = ()  => {
		const {
			theme,
			recordingCallback,
			finishAudioMessage,
			commandPreview,
			showCommandPreview,
			mentions,
			trackingType,
			showEmojiKeyboard,
			editCancel,
			openEmoji,
			closeEmoji,
			showSend,
			submit,
			showMessageBoxActions,
			isActionsEnabled,
			editing,
			Message_AudioRecorderEnabled,
		} = this.props;
		
		const recordAudio = showSend || !Message_AudioRecorderEnabled ? null : (
			<RecordAudio
				theme={theme}
				recordingCallback={recordingCallback}
				onFinish={finishAudioMessage}
				onPress={() => this.startRecordingAudio()}
			/>
		);

		return (
			<>
				<CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
				<Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
				<View style={[styles.bottomBarButtons, { backgroundColor: themes[theme].messageboxBackground }, editing && { backgroundColor: themes[theme].chatComponentBackground }]}>
					<LeftButtons
						theme={theme}
						showEmojiKeyboard={showEmojiKeyboard}
						editing={editing}
						isActionsEnabled
						showMessageBoxActions={showMessageBoxActions}
						editCancel={editCancel}
						openEmoji={openEmoji}
						closeEmoji={closeEmoji}
					/>
					<View style={styles.bottomBarRightButtons}>
						<RightButtons
							theme={theme}
							showSend={showSend}
							submit={submit}
							showMessageBoxActions={showMessageBoxActions}
							isActionsEnabled={isActionsEnabled}
						/>
						{recordAudio}
					</View>
				</View>
			</>
		);
	}

	render() {
		const {
			onChangeText,
			text,
			recording,
			theme,
			message,
			replyCancel,
			user,
			replying,
			getCustomEmoji,
			showEmojiKeyboard,
			onKeyboardResigned,
			onEmojiSelected,
			iOSScrollBehavior,
			innerRef,
			editing
		} = this.props;
		const { component, tracking } = innerRef;
		const buttonStyle = {
			...styles.fullScreenComposerCloseButton,
			backgroundColor: editing ? themes[theme].chatComponentBackground
				: themes[theme].messageboxBackground
		};
		const isAndroidTablet = isTablet && isAndroid ? {
			multiline: false,
			onSubmitEditing: submit,
			returnKeyType: 'send'
		} : {};
		const backgroundColor = editing ? themes[theme].chatComponentBackground : themes[theme].messageboxBackground;

		return (

			<Modal
				style={{ margin: 0 }}
				isVisible={true}
				useNativeDriver
				hideModalContentWhileAnimating
				animationInTiming={ANIMATIONTIME}
				animationOutTiming={ANIMATIONTIME}
			>
				<View style={{ backgroundColor, flex: 1 }}>
					<TouchableOpacity onPress={() => this.closeModal()} style={buttonStyle}>
						<CustomIcon name='Cross' size={30} color={themes[theme].tintColor} />
					</TouchableOpacity>
					<TextInput
						ref={component}
						style={styles.fullScreenComposerInput}
						returnKeyType='default'
						keyboardType='twitter'
						blurOnSubmit={false}
						placeholder={I18n.t('New_Message')}
						onChangeText={onChangeText}
						underlineColorAndroid='transparent'
						defaultValue={text}
						multiline
						autoFocus
						editable={!recording}
						testID='full-screen-messagebox-input'
						theme={theme}
						{...isAndroidTablet}
					/>
					<ReplyPreview
						message={message}
						close={replyCancel}
						username={user.username}
						replying={replying}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
					<KeyboardAccessoryView
						ref={tracking}
						renderContent={this.renderFullScreenBottomBar}
						kbInputRef={component}
						kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
						onKeyboardResigned={onKeyboardResigned}
						onItemSelected={onEmojiSelected}
						trackInteractive
						// revealKeyboardInteractive
						requiresSameParentToManageScrollView
						addBottomView
						bottomViewColor={themes[theme].messageboxBackground}
						iOSScrollBehavior={iOSScrollBehavior}
					/>
				</View>
			</Modal>
		);
	}

}

export default React.forwardRef((props, ref) => <FullScreenComposer 
innerRef={ref} {...props}
/>);
