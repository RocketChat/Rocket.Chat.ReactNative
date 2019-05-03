import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, ViewPropTypes, TouchableWithoutFeedback
} from 'react-native';
import moment from 'moment';
import { KeyboardUtils } from 'react-native-keyboard-input';
import Touchable from 'react-native-platform-touchable';
import { emojify } from 'react-emojione';
import removeMarkdown from 'remove-markdown';

import Image from './Image';
import User from './User';
import Avatar from '../Avatar';
import Audio from './Audio';
import Video from './Video';
import Markdown from './Markdown';
import Url from './Url';
import Reply from './Reply';
import ReactionsModal from './ReactionsModal';
import Emoji from './Emoji';
import styles from './styles';
import I18n from '../../i18n';
import messagesStatus from '../../constants/messagesStatus';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_DANGER } from '../../constants/colors';
import debounce from '../../utils/debounce';
import DisclosureIndicator from '../DisclosureIndicator';
import sharedStyles from '../../views/Styles';

const SYSTEM_MESSAGES = [
	'r',
	'au',
	'ru',
	'ul',
	'uj',
	'ut',
	'rm',
	'user-muted',
	'user-unmuted',
	'message_pinned',
	'subscription-role-added',
	'subscription-role-removed',
	'room_changed_description',
	'room_changed_announcement',
	'room_changed_topic',
	'room_changed_privacy',
	'message_snippeted',
	'thread-created'
];

const getInfoMessage = ({
	type, role, msg, author
}) => {
	const { username } = author;
	if (type === 'rm') {
		return I18n.t('Message_removed');
	} else if (type === 'uj') {
		return I18n.t('Has_joined_the_channel');
	} else if (type === 'ut') {
		return I18n.t('Has_joined_the_conversation');
	} else if (type === 'r') {
		return I18n.t('Room_name_changed', { name: msg, userBy: username });
	} else if (type === 'message_pinned') {
		return I18n.t('Message_pinned');
	} else if (type === 'ul') {
		return I18n.t('Has_left_the_channel');
	} else if (type === 'ru') {
		return I18n.t('User_removed_by', { userRemoved: msg, userBy: username });
	} else if (type === 'au') {
		return I18n.t('User_added_by', { userAdded: msg, userBy: username });
	} else if (type === 'user-muted') {
		return I18n.t('User_muted_by', { userMuted: msg, userBy: username });
	} else if (type === 'user-unmuted') {
		return I18n.t('User_unmuted_by', { userUnmuted: msg, userBy: username });
	} else if (type === 'subscription-role-added') {
		return `${ msg } was set ${ role } by ${ username }`;
	} else if (type === 'subscription-role-removed') {
		return `${ msg } is no longer ${ role } by ${ username }`;
	} else if (type === 'room_changed_description') {
		return I18n.t('Room_changed_description', { description: msg, userBy: username });
	} else if (type === 'room_changed_announcement') {
		return I18n.t('Room_changed_announcement', { announcement: msg, userBy: username });
	} else if (type === 'room_changed_topic') {
		return I18n.t('Room_changed_topic', { topic: msg, userBy: username });
	} else if (type === 'room_changed_privacy') {
		return I18n.t('Room_changed_privacy', { type: msg, userBy: username });
	} else if (type === 'message_snippeted') {
		return I18n.t('Created_snippet');
	}
	return '';
};
const BUTTON_HIT_SLOP = {
	top: 4, right: 4, bottom: 4, left: 4
};

export default class Message extends PureComponent {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		customEmojis: PropTypes.object.isRequired,
		timeFormat: PropTypes.string.isRequired,
		customThreadTimeFormat: PropTypes.string,
		msg: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		author: PropTypes.shape({
			_id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			name: PropTypes.string
		}),
		status: PropTypes.any,
		reactions: PropTypes.any,
		editing: PropTypes.bool,
		style: ViewPropTypes.style,
		archived: PropTypes.bool,
		broadcast: PropTypes.bool,
		reactionsModal: PropTypes.bool,
		type: PropTypes.string,
		header: PropTypes.bool,
		isThreadReply: PropTypes.bool,
		isThreadSequential: PropTypes.bool,
		avatar: PropTypes.string,
		alias: PropTypes.string,
		ts: PropTypes.oneOfType([
			PropTypes.instanceOf(Date),
			PropTypes.string
		]),
		edited: PropTypes.bool,
		attachments: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object
		]),
		urls: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object
		]),
		useRealName: PropTypes.bool,
		dcount: PropTypes.number,
		dlm: PropTypes.instanceOf(Date),
		tmid: PropTypes.string,
		tcount: PropTypes.number,
		tlm: PropTypes.instanceOf(Date),
		tmsg: PropTypes.string,
		// methods
		closeReactions: PropTypes.func,
		onErrorPress: PropTypes.func,
		onLongPress: PropTypes.func,
		onReactionLongPress: PropTypes.func,
		onReactionPress: PropTypes.func,
		onDiscussionPress: PropTypes.func,
		onThreadPress: PropTypes.func,
		replyBroadcast: PropTypes.func,
		toggleReactionPicker: PropTypes.func,
		fetchThreadName: PropTypes.func
	}

	static defaultProps = {
		archived: false,
		broadcast: false,
		attachments: [],
		urls: [],
		reactions: [],
		onLongPress: () => {}
	}

	onPress = debounce(() => {
		KeyboardUtils.dismiss();

		const { onThreadPress, tlm, tmid } = this.props;
		if ((tlm || tmid) && onThreadPress) {
			onThreadPress();
		}
	}, 300, true)

	onLongPress = () => {
		const { archived, onLongPress } = this.props;
		if (this.isInfoMessage() || this.hasError() || archived) {
			return;
		}
		onLongPress();
	}

	formatLastMessage = (lm) => {
		const { customThreadTimeFormat } = this.props;
		if (customThreadTimeFormat) {
			return moment(lm).format(customThreadTimeFormat);
		}
		return lm ? moment(lm).calendar(null, {
			lastDay: `[${ I18n.t('Yesterday') }]`,
			sameDay: 'h:mm A',
			lastWeek: 'dddd',
			sameElse: 'MMM D'
		}) : null;
	}

	formatMessageCount = (count, type) => {
		const discussion = type === 'discussion';
		let text = discussion ? I18n.t('No_messages_yet') : null;
		if (count === 1) {
			text = `${ count } ${ discussion ? I18n.t('message') : I18n.t('reply') }`;
		} else if (count > 1 && count < 1000) {
			text = `${ count } ${ discussion ? I18n.t('messages') : I18n.t('replies') }`;
		} else if (count > 999) {
			text = `+999 ${ discussion ? I18n.t('messages') : I18n.t('replies') }`;
		}
		return text;
	}

	isInfoMessage = () => {
		const { type } = this.props;
		return SYSTEM_MESSAGES.includes(type);
	}

	isOwn = () => {
		const { author, user } = this.props;
		return author._id === user.id;
	}

	isDeleted() {
		const { type } = this.props;
		return type === 'rm';
	}

	isTemp() {
		const { status } = this.props;
		return status === messagesStatus.TEMP || status === messagesStatus.ERROR;
	}

	hasError() {
		const { status } = this.props;
		return status === messagesStatus.ERROR;
	}

	renderAvatar = (small = false) => {
		const {
			header, avatar, author, baseUrl, user
		} = this.props;
		if (header) {
			return (
				<Avatar
					style={small ? styles.avatarSmall : styles.avatar}
					text={avatar ? '' : author.username}
					size={small ? 20 : 36}
					borderRadius={small ? 2 : 4}
					avatar={avatar}
					baseUrl={baseUrl}
					userId={user.id}
					token={user.token}
				/>
			);
		}
		return null;
	}

	renderUsername = () => {
		const {
			header, timeFormat, author, alias, ts, useRealName
		} = this.props;
		if (header) {
			return (
				<User
					onPress={this.onPress}
					timeFormat={timeFormat}
					username={(useRealName && author.name) || author.username}
					alias={alias}
					ts={ts}
					temp={this.isTemp()}
				/>
			);
		}
		return null;
	}

	renderContent() {
		if (this.isInfoMessage()) {
			return <Text style={styles.textInfo}>{getInfoMessage({ ...this.props })}</Text>;
		}

		const {
			customEmojis, msg, baseUrl, user, edited, tmid
		} = this.props;

		if (tmid && !msg) {
			return <Text style={styles.text}>{I18n.t('Sent_an_attachment')}</Text>;
		}

		return (
			<Markdown
				msg={msg}
				customEmojis={customEmojis}
				baseUrl={baseUrl}
				username={user.username}
				edited={edited}
				numberOfLines={tmid ? 1 : 0}
			/>
		);
	}

	renderAttachment() {
		const { attachments, timeFormat } = this.props;

		if (attachments.length === 0) {
			return null;
		}

		return attachments.map((file, index) => {
			const { user, baseUrl, customEmojis } = this.props;
			if (file.image_url) {
				return <Image key={file.image_url} file={file} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
			}
			if (file.audio_url) {
				return <Audio key={file.audio_url} file={file} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
			}
			if (file.video_url) {
				return <Video key={file.video_url} file={file} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
			}

			// eslint-disable-next-line react/no-array-index-key
			return <Reply key={index} index={index} attachment={file} timeFormat={timeFormat} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
		});
	}

	renderUrl = () => {
		const { urls, user, baseUrl } = this.props;
		if (urls.length === 0) {
			return null;
		}

		return urls.map((url, index) => (
			<Url url={url} key={url.url} index={index} user={user} baseUrl={baseUrl} />
		));
	}

	renderError = () => {
		if (!this.hasError()) {
			return null;
		}
		const { onErrorPress } = this.props;
		return (
			<Touchable onPress={onErrorPress} style={styles.errorButton}>
				<CustomIcon name='circle-cross' color={COLOR_DANGER} size={20} />
			</Touchable>
		);
	}

	renderReaction = (reaction) => {
		const {
			user, onReactionLongPress, onReactionPress, customEmojis, baseUrl
		} = this.props;
		const reacted = reaction.usernames.findIndex(item => item.value === user.username) !== -1;
		return (
			<Touchable
				onPress={() => onReactionPress(reaction.emoji)}
				onLongPress={onReactionLongPress}
				key={reaction.emoji}
				testID={`message-reaction-${ reaction.emoji }`}
				style={[styles.reactionButton, reacted && styles.reactionButtonReacted]}
				background={Touchable.Ripple('#fff')}
				hitSlop={BUTTON_HIT_SLOP}
			>
				<View style={[styles.reactionContainer, reacted && styles.reactedContainer]}>
					<Emoji
						content={reaction.emoji}
						customEmojis={customEmojis}
						standardEmojiStyle={styles.reactionEmoji}
						customEmojiStyle={styles.reactionCustomEmoji}
						baseUrl={baseUrl}
					/>
					<Text style={styles.reactionCount}>{ reaction.usernames.length }</Text>
				</View>
			</Touchable>
		);
	}

	renderReactions() {
		const { reactions, toggleReactionPicker } = this.props;
		if (reactions.length === 0) {
			return null;
		}
		return (
			<View style={styles.reactionsContainer}>
				{reactions.map(this.renderReaction)}
				<Touchable
					onPress={toggleReactionPicker}
					key='message-add-reaction'
					testID='message-add-reaction'
					style={styles.reactionButton}
					background={Touchable.Ripple('#fff')}
					hitSlop={BUTTON_HIT_SLOP}
				>
					<View style={styles.reactionContainer}>
						<CustomIcon name='add-reaction' size={21} style={styles.addReaction} />
					</View>
				</Touchable>
			</View>
		);
	}

	renderBroadcastReply() {
		const { broadcast, replyBroadcast } = this.props;
		if (broadcast && !this.isOwn()) {
			return (
				<View style={styles.buttonContainer}>
					<Touchable
						onPress={replyBroadcast}
						background={Touchable.Ripple('#fff')}
						style={styles.button}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<React.Fragment>
							<CustomIcon name='back' size={20} style={styles.buttonIcon} />
							<Text style={styles.buttonText}>{I18n.t('Reply')}</Text>
						</React.Fragment>
					</Touchable>
				</View>
			);
		}
		return null;
	}

	renderDiscussion = () => {
		const {
			msg, dcount, dlm, onDiscussionPress
		} = this.props;
		const time = this.formatLastMessage(dlm);
		const buttonText = this.formatMessageCount(dcount, 'discussion');
		return (
			<React.Fragment>
				<Text style={styles.startedDiscussion}>{I18n.t('Started_discussion')}</Text>
				<Text style={styles.text}>{msg}</Text>
				<View style={styles.buttonContainer}>
					<Touchable
						onPress={onDiscussionPress}
						background={Touchable.Ripple('#fff')}
						style={[styles.button, styles.smallButton]}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<React.Fragment>
							<CustomIcon name='chat' size={20} style={styles.buttonIcon} />
							<Text style={styles.buttonText}>{buttonText}</Text>
						</React.Fragment>
					</Touchable>
					<Text style={styles.time}>{time}</Text>
				</View>
			</React.Fragment>
		);
	}

	renderThread = () => {
		const {
			tcount, tlm, onThreadPress, msg
		} = this.props;

		if (!tlm) {
			return null;
		}

		const time = this.formatLastMessage(tlm);
		const buttonText = this.formatMessageCount(tcount, 'thread');
		return (
			<View style={styles.buttonContainer}>
				<Touchable
					onPress={onThreadPress}
					background={Touchable.Ripple('#fff')}
					style={[styles.button, styles.smallButton]}
					hitSlop={BUTTON_HIT_SLOP}
					testID={`message-thread-button-${ msg }`}
				>
					<React.Fragment>
						<CustomIcon name='thread' size={20} style={styles.buttonIcon} />
						<Text style={styles.buttonText}>{buttonText}</Text>
					</React.Fragment>
				</Touchable>
				<Text style={styles.time}>{time}</Text>
			</View>
		);
	}

	renderRepliedThread = () => {
		const {
			tmid, tmsg, header, fetchThreadName
		} = this.props;
		if (!tmid || !header || this.isTemp()) {
			return null;
		}

		if (!tmsg) {
			fetchThreadName(tmid);
			return null;
		}

		let msg = emojify(tmsg, { output: 'unicode' });
		msg = removeMarkdown(msg);

		return (
			<View style={styles.repliedThread} testID={`message-thread-replied-on-${ msg }`}>
				<CustomIcon name='thread' size={20} style={styles.repliedThreadIcon} />
				<Text style={styles.repliedThreadName} numberOfLines={1}>{msg}</Text>
				<DisclosureIndicator />
			</View>
		);
	}

	renderInner = () => {
		const { type } = this.props;
		if (type === 'discussion-created') {
			return (
				<React.Fragment>
					{this.renderUsername()}
					{this.renderDiscussion()}
				</React.Fragment>
			);
		}
		return (
			<React.Fragment>
				{this.renderUsername()}
				{this.renderContent()}
				{this.renderAttachment()}
				{this.renderUrl()}
				{this.renderThread()}
				{this.renderReactions()}
				{this.renderBroadcastReply()}
			</React.Fragment>
		);
	}

	renderMessage = () => {
		const { header, isThreadReply, isThreadSequential } = this.props;

		if (isThreadReply || isThreadSequential || this.isInfoMessage()) {
			const thread = isThreadReply ? this.renderRepliedThread() : null;
			return (
				<React.Fragment>
					{thread}
					<View style={[styles.flex, sharedStyles.alignItemsCenter]}>
						{this.renderAvatar(true)}
						<View
							style={[
								styles.messageContent,
								header && styles.messageContentWithHeader,
								this.hasError() && header && styles.messageContentWithHeader,
								this.hasError() && !header && styles.messageContentWithError,
								this.isTemp() && styles.temp
							]}
						>
							{this.renderContent()}
						</View>
					</View>
				</React.Fragment>
			);
		}
		return (
			<View style={styles.flex}>
				{this.renderAvatar()}
				<View
					style={[
						styles.messageContent,
						header && styles.messageContentWithHeader,
						this.hasError() && header && styles.messageContentWithHeader,
						this.hasError() && !header && styles.messageContentWithError,
						this.isTemp() && styles.temp
					]}
				>
					{this.renderInner()}
				</View>
			</View>
		);
	}

	render() {
		const {
			editing, style, reactionsModal, closeReactions, msg, ts, reactions, author, user, timeFormat, customEmojis, baseUrl
		} = this.props;
		const accessibilityLabel = I18n.t('Message_accessibility', { user: author.username, time: moment(ts).format(timeFormat), message: msg });

		return (
			<View style={styles.root}>
				{this.renderError()}
				<TouchableWithoutFeedback
					onLongPress={this.onLongPress}
					onPress={this.onPress}
				>
					<View
						style={[styles.container, editing && styles.editing, style]}
						accessibilityLabel={accessibilityLabel}
					>
						{this.renderMessage()}
						{reactionsModal
							? (
								<ReactionsModal
									isVisible={reactionsModal}
									reactions={reactions}
									user={user}
									customEmojis={customEmojis}
									baseUrl={baseUrl}
									close={closeReactions}
								/>
							)
							: null
						}
					</View>
				</TouchableWithoutFeedback>
			</View>
		);
	}
}
