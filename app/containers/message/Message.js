import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, ViewPropTypes, TouchableWithoutFeedback
} from 'react-native';
import moment from 'moment';
import { KeyboardUtils } from 'react-native-keyboard-input';

import User from './User';
import MessageError from './MessageError';
import styles from './styles';
import I18n from '../../i18n';
import debounce from '../../utils/debounce';
import sharedStyles from '../../views/Styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Attachments from './Attachments';
import Urls from './Urls';
import Thread from './Thread';
import Reactions from './Reactions';
import Broadcast from './Broadcast';
import Discussion from './Discussion';
import { getInfoMessage } from './utils';

const onPress = debounce(({ onThreadPress, tlm, tmid }) => {
	KeyboardUtils.dismiss();

	if ((tlm || tmid) && onThreadPress) {
		onThreadPress();
	}
}, 300, true);

const onLongPress = ({
	archived, onLongPress: onLongPressProp, type, status, isInfo, hasError
}) => {
	if (isInfo({ type }) || hasError({ status }) || archived) {
		return;
	}
	onLongPressProp();
};

const RenderContent = React.memo((props) => {
	if (props.isInfo) {
		return <Text style={styles.textInfo}>{getInfoMessage({ ...props })}</Text>;
	}

	if (props.tmid && !props.msg) {
		return <Text style={styles.text}>{I18n.t('Sent_an_attachment')}</Text>;
	}

	return <Text>{props.msg}</Text>;
	// return (
	// 	<Markdown
	// 		msg={msg}
	// 		customEmojis={customEmojis}
	// 		baseUrl={baseUrl}
	// 		username={user.username}
	// 		edited={edited}
	// 		numberOfLines={tmid ? 1 : 0}
	// 	/>
	// );
});

const RenderInner = React.memo((props) => {
	if (props.type === 'discussion-created') {
		return (
			<React.Fragment>
				<User isTemp={props.isTemp} {...props} />
				<Discussion {...props} />
			</React.Fragment>
		);
	}
	return (
		<React.Fragment>
			<User {...props} />
			<RenderContent {...props} />
			<Attachments {...props} />
			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
		</React.Fragment>
	);
});

const RenderMessage = React.memo((props) => {
	if (props.isThreadReply || props.isThreadSequential || props.isInfo) {
		const thread = props.isThreadReply ? <RepliedThread isTemp={props.isTemp} {...props} /> : null;
		return (
			<React.Fragment>
				{thread}
				<View style={[styles.flex, sharedStyles.alignItemsCenter]}>
					<MessageAvatar small {...props} />
					<View
						style={[
							styles.messageContent,
							props.header && styles.messageContentWithHeader,
							props.hasError && props.header && styles.messageContentWithHeader,
							props.hasError && !props.header && styles.messageContentWithError,
							props.isTemp && styles.temp
						]}
					>
						<RenderContent {...props} />
					</View>
				</View>
			</React.Fragment>
		);
	}
	return (
		<View style={styles.flex}>
			<MessageAvatar {...props} />
			<View
				style={[
					styles.messageContent,
					props.header && styles.messageContentWithHeader,
					props.hasError && props.header && styles.messageContentWithHeader,
					props.hasError && !props.header && styles.messageContentWithError,
					props.isTemp && styles.temp
				]}
			>
				<RenderInner isTemp={props.isTemp} {...props} />
			</View>
		</View>
	);
});

const Message = React.memo((props) => {
	const accessibilityLabel = I18n.t('Message_accessibility', {
		user: props.author.username, 
		time: moment(props.ts).format(props.timeFormat), 
		message: props.msg
	});

	return (
		<View style={styles.root}>
			<MessageError hasError={props.hasError} {...props} />
			<TouchableWithoutFeedback
				onLongPress={() => onLongPress(props)}
				onPress={() => onPress(props)}
			>
				<View
					style={[styles.container, props.editing && styles.editing, props.style]}
					accessibilityLabel={accessibilityLabel}
				>
					<RenderMessage isTemp={props.isTemp} hasError={props.hasError} {...props} />
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
});

export default Message;
