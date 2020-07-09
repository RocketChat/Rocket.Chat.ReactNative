import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
	View, TouchableOpacity, Keyboard
} from 'react-native';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
import Modal from 'react-native-modal';

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

const FullScreenComposer = React.forwardRef(({
	closeEmoji,
	toggleFullScreen,
	commandPreview,
	editCancel,
	editing,
	finishAudioMessage,
	getCustomEmoji,
	iOSScrollBehavior,
	isActionsEnabled,
	isFullScreen,
	mentions,
	message,
	Message_AudioRecorderEnabled,
	onChangeText,
	onKeyboardResigned,
	onEmojiSelected,
	openEmoji,
	recording,
	recordingCallback,
	replyCancel,
	replying,
	showCommandPreview,
	showEmojiKeyboard,
	showMessageBoxActions,
	showSend,
	submit,
	text,
	theme,
	toggleRecordAudioWithState,
	trackingType,
	user
}, ref) => {
	const animationTime = 300;
	const backgroundColor = editing ? themes[theme].chatComponentBackground : themes[theme].messageboxBackground;
	const [modalState, setModalState] = useState(isFullScreen);
	const { component, tracking } = ref;

	const isAndroidTablet = isTablet && isAndroid ? {
		multiline: false,
		onSubmitEditing: submit,
		returnKeyType: 'send'
	} : {};

	function closeModal() {
		Keyboard.dismiss();
		setTimeout(toggleFullScreen, animationTime * 0.09);
		setModalState(!modalState);
	}

	function renderCloseButton() {
		const buttonStyle = {
			...styles.fullScreenComposerCloseButton,
			backgroundColor: editing ? themes[theme].chatComponentBackground
				: themes[theme].messageboxBackground
		};
		return (
			<TouchableOpacity onPress={() => closeModal()} style={buttonStyle}>
				<CustomIcon name='Cross' size={30} color={themes[theme].tintColor} />
			</TouchableOpacity>
		);
	}

	function startRecordingAudio() {
		toggleRecordAudioWithState();
		closeModal();
	}

	function renderFullScreenBottomBar() {
		const recordAudio = showSend || !Message_AudioRecorderEnabled ? null : (
			<RecordAudio
				theme={theme}
				recordingCallback={recordingCallback}
				onFinish={finishAudioMessage}
				onPress={() => startRecordingAudio()}
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

	return (
		<Modal
			style={{ margin: 0 }}
			isVisible={modalState}
			useNativeDriver
			hideModalContentWhileAnimating
			animationInTiming={animationTime}
			animationOutTiming={animationTime}
		>
			<View style={{ backgroundColor, flex: 1 }}>
				{renderCloseButton()}
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
					renderContent={renderFullScreenBottomBar}
					kbInputRef={ref}
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
});

FullScreenComposer.propTypes = {
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
	})
};

export default FullScreenComposer;
