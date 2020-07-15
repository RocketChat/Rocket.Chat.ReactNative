import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
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
import OpenFullScreenButton from './buttons/OpenFullScreenButton';

class MainComposer extends Component {
	static propTypes = {
		children: PropTypes.node,
		closeEmoji: PropTypes.func,
		commandPreview: PropTypes.array,
		editing: PropTypes.bool,
		editCancel: PropTypes.func,
		finishAudioMessage: PropTypes.func,
		getCustomEmoji: PropTypes.func,
		iOSScrollBehavior: PropTypes.number,
		isActionsEnabled: PropTypes.bool,
		mentions: PropTypes.array,
		message: PropTypes.object,
		Message_AudioRecorderEnabled: PropTypes.bool,
		onChangeText: PropTypes.func,
		onEmojiSelected: PropTypes.func,
		onKeyboardResigned: PropTypes.func,
		openEmoji: PropTypes.func,
		recording: PropTypes.bool,
		recordingCallback: PropTypes.func,
		recordStartState: PropTypes.bool,
		replying: PropTypes.bool,
		replyCancel: PropTypes.func,
		showCommandPreview: PropTypes.bool,
		showEmojiKeyboard: PropTypes.bool,
		showMessageBoxActions: PropTypes.func,
		showSend: PropTypes.bool,
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

	shouldComponentUpdate(nextProps) {
		const {
			showEmojiKeyboard,
			showSend,
			recording,
			mentions,
			commandPreview,
			replying,
			editing,
			message,
			theme,
			children
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
		if (!equal(nextProps.children, children)) {
			return true;
		}
		return false;
	}

	renderContent = () => {
		const {
			submit,
			showSend,
			Message_AudioRecorderEnabled,
			theme,
			recordingCallback,
			finishAudioMessage,
			recordStartState,
			toggleRecordAudioWithState,
			commandPreview,
			showCommandPreview,
			mentions,
			trackingType,
			message,
			replyCancel,
			user,
			replying,
			getCustomEmoji,
			showEmojiKeyboard,
			editing,
			showMessageBoxActions,
			editCancel,
			openEmoji,
			closeEmoji,
			isActionsEnabled,
			onChangeText,
			text,
			recording,
			children,
			toggleFullScreen,
			innerRef
		} = this.props;
		const { component } = innerRef;
		const isAndroidTablet = isTablet && isAndroid ? {
			multiline: false,
			onSubmitEditing: submit,
			returnKeyType: 'send'
		} : {};

		const openFullScreen = isActionsEnabled && !recording ? (
			<OpenFullScreenButton theme={theme} onPress={toggleFullScreen} />
		) : null;

		const recordAudio = showSend || !Message_AudioRecorderEnabled ? null : (
			<RecordAudio
				theme={theme}
				recordingCallback={recordingCallback}
				onFinish={finishAudioMessage}
				recordStartState={recordStartState}
				toggleRecordAudioWithState={toggleRecordAudioWithState}
			/>
		);

		const commandsPreviewAndMentions = !recording ? (
			<>
				<CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
				<Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
			</>
		) : null;

		const replyPreview = !recording ? (
			<ReplyPreview
				message={message}
				close={replyCancel}
				username={user.username}
				replying={replying}
				getCustomEmoji={getCustomEmoji}
				theme={theme}
			/>
		) : null;

		const textInputAndButtons = !recording ? (
			<>
				<LeftButtons
					theme={theme}
					showEmojiKeyboard={showEmojiKeyboard}
					editing={editing}
					showMessageBoxActions={showMessageBoxActions}
					editCancel={editCancel}
					openEmoji={openEmoji}
					closeEmoji={closeEmoji}
					isActionsEnabled={isActionsEnabled}
				/>
				<TextInput
					ref={component}
					style={styles.textBoxInput}
					returnKeyType='default'
					keyboardType='twitter'
					blurOnSubmit={false}
					placeholder={I18n.t('New_Message')}
					onChangeText={onChangeText}
					underlineColorAndroid='transparent'
					defaultValue={text}
					multiline
					testID='messagebox-input'
					theme={theme}
					{...isAndroidTablet}
				/>
				{openFullScreen}
				<RightButtons
					theme={theme}
					showSend={showSend}
					submit={submit}
					showMessageBoxActions={showMessageBoxActions}
					isActionsEnabled={isActionsEnabled}
				/>
			</>
		) : null;

		return (
			<>
				{commandsPreviewAndMentions}
				<View style={[styles.composer, { borderTopColor: themes[theme].borderColor }]}>
					{replyPreview}
					<View
						style={[
							styles.textArea,
							{ backgroundColor: themes[theme].messageboxBackground },
							!recording && editing && { backgroundColor: themes[theme].chatComponentBackground }
						]}
						testID='messagebox'
					>
						{textInputAndButtons}
						{recordAudio}
					</View>
				</View>
				{children}
			</>
		);
	}


	render() {
		const {
			showEmojiKeyboard,
			onEmojiSelected,
			onKeyboardResigned,
			iOSScrollBehavior,
			theme,
			innerRef
		} = this.props;
		const { component, tracking } = innerRef;

		return (
			<KeyboardAccessoryView
				ref={tracking}
				renderContent={this.renderContent}
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
		);
	}
}

export default React.forwardRef((props, ref) => (
	<MainComposer
		innerRef={ref}
		{...props}
	/>
));
