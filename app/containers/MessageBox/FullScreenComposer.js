import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, TouchableOpacity
} from 'react-native';
import { KeyboardAccessoryView, KeyboardUtils } from 'react-native-keyboard-input';
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

class FullScreenComposer extends Component {
	static propTypes = {
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
		innerRef: PropTypes.object,
		autoFocus: PropTypes.bool,
		backdropOpacity: PropTypes.number
	};

	static defaultProps = {
		autoFocus: true,
		backdropOpacity: 0.70 // Default value of backdropOpacity in React native modal
	}

	state = {
		// eslint-disable-next-line react/destructuring-assignment
		isOpen: this.props.isFullScreen
	};

	shouldComponentUpdate(nextProps, nextState) {
		const {
			theme,
			replying,
			editing,
			showEmojiKeyboard,
			showSend,
			recording,
			mentions,
			commandPreview,
			message
		} = this.props;
		const { isOpen } = this.state;

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
		if (nextState.isOpen !== isOpen) {
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
		return false;
	}

	closeModal = () => {
		const { toggleFullScreen } = this.props;
		KeyboardUtils.dismiss();
		this.setState(prevState => ({
			isOpen: !prevState.isOpen
		}));
		toggleFullScreen();
	}

	startRecordingAudio = () => {
		const { toggleRecordAudioWithState } = this.props;
		toggleRecordAudioWithState();
		this.closeModal();
	}

	renderFullScreenBottomBar = () => {
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
			message,
			replyCancel,
			user,
			replying,
			getCustomEmoji
		} = this.props;
		const buttonsViewStyle = {
			...styles.bottomBarButtons,
			backgroundColor: editing ? themes[theme].chatComponentBackground : themes[theme].messageboxBackground
		};

		const recordAudio = showSend || !Message_AudioRecorderEnabled ? null : (
			<RecordAudio
				theme={theme}
				recordingCallback={recordingCallback}
				onFinish={finishAudioMessage}
				onPress={this.startRecordingAudio}
			/>
		);

		return (
			<>
				<CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
				<Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
				<View style={{ borderTopColor: themes[theme].borderColor }}>
					<ReplyPreview
						message={message}
						close={replyCancel}
						username={user.username}
						replying={replying}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
					<View style={buttonsViewStyle}>
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
			showEmojiKeyboard,
			onKeyboardResigned,
			onEmojiSelected,
			iOSScrollBehavior,
			innerRef,
			editing,
			submit,
			autoFocus,
			backdropOpacity
		} = this.props;
		const { component, tracking } = innerRef;
		const { isOpen } = this.state;
		const isAndroidTablet = isTablet && isAndroid ? {
			multiline: false,
			onSubmitEditing: submit,
			returnKeyType: 'send'
		} : {};
		const backgroundColor = editing ? themes[theme].chatComponentBackground : themes[theme].messageboxBackground;

		return (

			<Modal
				style={{ margin: 0 }}
				isVisible={isOpen}
				useNativeDriver
				hideModalContentWhileAnimating
				coverScreen={false}
				backdropOpacity={backdropOpacity}
				swipeDirection='down'
				onSwipeComplete={() => this.closeModal()}
			>
				<View style={{ backgroundColor, flex: 1 }}>
					<TouchableOpacity onPress={() => this.closeModal()} style={styles.fullScreenComposerCloseButton}>
						<CustomIcon name='minimize-arrow' size={30} color={themes[theme].tintColor} />
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
						autoFocus={autoFocus}
						editable={!recording}
						testID='full-screen-messagebox-input'
						theme={theme}
						{...isAndroidTablet}
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

export default React.forwardRef((props, ref) => (
	<FullScreenComposer
		innerRef={ref}
		{...props}
	/>
));
