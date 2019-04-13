import React from 'react';
import { TextInput, View } from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import styles from './styles';
import I18n from '../../i18n';
import { COLOR_PRIMARY, COLOR_TEXT_DESCRIPTION } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';

const leftButtons = ({
	editing, editCancel, showEmojiKeyboard, openEmoji, closeEmoji
}) => {
	if (editing) {
		return (
			<BorderlessButton
				onPress={editCancel}
				accessibilityLabel={I18n.t('Cancel_editing')}
				accessibilityTraits='button'
				style={styles.actionButton}
				testID='messagebox-cancel-editing'
			>
				<CustomIcon
					size={22}
					color={COLOR_PRIMARY}
					name='cross'
				/>
			</BorderlessButton>
		);
	}
	return !showEmojiKeyboard
		? (
			<BorderlessButton
				onPress={openEmoji}
				accessibilityLabel={I18n.t('Open_emoji_selector')}
				accessibilityTraits='button'
				style={styles.actionButton}
				testID='messagebox-open-emoji'
			>
				<CustomIcon
					size={22}
					color={COLOR_PRIMARY}
					name='emoji'
				/>
			</BorderlessButton>
		)
		: (
			<BorderlessButton
				onPress={closeEmoji}
				accessibilityLabel={I18n.t('Close_emoji_selector')}
				accessibilityTraits='button'
				style={styles.actionButton}
				testID='messagebox-close-emoji'
			>
				<CustomIcon
					size={22}
					color={COLOR_PRIMARY}
					name='keyboard'
				/>
			</BorderlessButton>
		);
};

const rightButtons = ({
	showSend, submit, recordAudioMessage, toggleFilesActions
}) => {
	if (showSend) {
		return (
			<BorderlessButton
				key='send-message'
				onPress={submit}
				style={styles.actionButton}
				testID='messagebox-send-message'
				accessibilityLabel={I18n.t('Send message')}
				accessibilityTraits='button'
			>
				<CustomIcon name='send1' size={23} color={COLOR_PRIMARY} />
			</BorderlessButton>
		);
	}
	return [
		(
			<BorderlessButton
				key='audio-message'
				onPress={recordAudioMessage}
				style={styles.actionButton}
				testID='messagebox-send-audio'
				accessibilityLabel={I18n.t('Send audio message')}
				accessibilityTraits='button'
			>
				<CustomIcon name='mic' size={23} color={COLOR_PRIMARY} />
			</BorderlessButton>
		),
		(
			<BorderlessButton
				key='file-message'
				onPress={toggleFilesActions}
				style={styles.actionButton}
				testID='messagebox-actions'
				accessibilityLabel={I18n.t('Message actions')}
				accessibilityTraits='button'
			>
				<CustomIcon name='plus' size={23} color={COLOR_PRIMARY} />
			</BorderlessButton>
		)
	];
};

const MessageBoxContent = ({
	setTextInputRef,
	showSend,
	submit,
	recordAudioMessage,
	toggleFilesActions,
	editing,
	onChangeText,
	renderReplyPreview,
	editCancel,
	showEmojiKeyboard,
	openEmoji,
	closeEmoji
}) => (
	<View style={styles.composer} key='messagebox'>
		{renderReplyPreview()}
		<View
			style={[styles.textArea, editing && styles.editing]}
			testID='messagebox'
		>
			{leftButtons({
				editing, editCancel, showEmojiKeyboard, openEmoji, closeEmoji
			})}
			<TextInput
				ref={setTextInputRef}
				style={styles.textBoxInput}
				returnKeyType='default'
				keyboardType='twitter'
				blurOnSubmit={false}
				placeholder={I18n.t('New_Message')}
				onChangeText={onChangeText}
				underlineColorAndroid='transparent'
				defaultValue=''
				multiline
				placeholderTextColor={COLOR_TEXT_DESCRIPTION}
				testID='messagebox-input'
			/>
			{rightButtons({
				showSend, submit, recordAudioMessage, toggleFilesActions
			})}
		</View>
	</View>
);

leftButtons.propTypes = {
	editing: PropTypes.bool.isRequired,
	editCancel: PropTypes.func.isRequired,
	showEmojiKeyboard: PropTypes.bool.isRequired,
	openEmoji: PropTypes.func.isRequired,
	closeEmoji: PropTypes.func.isRequired
};

rightButtons.propTypes = {
	showSend: PropTypes.bool.isRequired,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	toggleFilesActions: PropTypes.func.isRequired
};

MessageBoxContent.propTypes = {
	setTextInputRef: PropTypes.func.isRequired,
	showSend: PropTypes.bool.isRequired,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	toggleFilesActions: PropTypes.func.isRequired,
	editing: PropTypes.bool.isRequired,
	onChangeText: PropTypes.func.isRequired,
	renderReplyPreview: PropTypes.func.isRequired,
	editCancel: PropTypes.func.isRequired,
	showEmojiKeyboard: PropTypes.bool.isRequired,
	openEmoji: PropTypes.func.isRequired,
	closeEmoji: PropTypes.func.isRequired
};

export default MessageBoxContent;
