import React from 'react';
import { TextInput, View } from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import styles from './styles';
import I18n from '../../i18n';
import { COLOR_PRIMARY, COLOR_TEXT_DESCRIPTION } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import IOSKeyboardAvoidingView from '../IOSKeyboardAvoidingView';

const iconSize = 22;

const attachFileButton = ({ toggleFilesActions }) => (
	<BorderlessButton
		key='file-message'
		onPress={toggleFilesActions}
		style={styles.actionButton}
		testID='messagebox-actions'
		accessibilityLabel={I18n.t('Message actions')}
		accessibilityTraits='button'
	>
		<CustomIcon name='plus' size={iconSize} color={COLOR_PRIMARY} />
	</BorderlessButton>
);

const rightButtons = ({ showSend, submit, recordAudioMessage }) => (showSend ? (
	<BorderlessButton
		key='send-message'
		onPress={submit}
		style={styles.actionButton}
		testID='messagebox-send-message'
		accessibilityLabel={I18n.t('Send message')}
		accessibilityTraits='button'
	>
		<CustomIcon name='send1' size={iconSize} color={COLOR_PRIMARY} />
	</BorderlessButton>
)
	: (
		<BorderlessButton
			key='audio-message'
			onPress={recordAudioMessage}
			style={styles.actionButton}
			testID='messagebox-send-audio'
			accessibilityLabel={I18n.t('Send audio message')}
			accessibilityTraits='button'
		>
			<CustomIcon name='mic' size={iconSize} color={COLOR_PRIMARY} />
		</BorderlessButton>
	));

const MessageBoxContent = ({
	setTextInputRef,
	showSend,
	submit,
	recordAudioMessage,
	toggleFilesActions,
	editing,
	onChangeText,
	renderReplyPreview
}) => (
	<IOSKeyboardAvoidingView style={styles.composer} key='messagebox'>
		{renderReplyPreview()}
		<View
			style={[styles.textArea, editing && styles.editing]}
			testID='messagebox'
		>
			{attachFileButton({ toggleFilesActions })}
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
			{rightButtons({ showSend, submit, recordAudioMessage })}
		</View>
	</IOSKeyboardAvoidingView>
);

attachFileButton.propTypes = {
	toggleFilesActions: PropTypes.func.isRequired
};

rightButtons.propTypes = {
	showSend: PropTypes.bool.isRequired,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired
};

MessageBoxContent.propTypes = {
	setTextInputRef: PropTypes.func.isRequired,
	showSend: PropTypes.bool.isRequired,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	toggleFilesActions: PropTypes.func.isRequired,
	editing: PropTypes.bool.isRequired,
	onChangeText: PropTypes.func.isRequired,
	renderReplyPreview: PropTypes.func.isRequired
};

export default MessageBoxContent;
