import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { dequal } from 'dequal';

import I18n from '../../i18n';
import styles from './styles';
import Markdown from '../markdown';
import User from './User';
import { getInfoMessage, SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME } from './utils';
import { themes } from '../../constants/colors';
import MessageContext from './Context';
import Encrypted from './Encrypted';
import { E2E_MESSAGE_TYPE } from '../../lib/encryption/constants';

const Content = React.memo((props) => {
	if (props.isInfo) {
		const infoMessage = getInfoMessage({ ...props });

		const renderMessageContent = (
			<Text
				style={[styles.textInfo, { color: themes[props.theme].auxiliaryText }]}
				accessibilityLabel={infoMessage}
			>
				{infoMessage}
			</Text>
		);

		if (SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME.includes(props.type)) {
			return (
				<Text>
					<User {...props} /> {renderMessageContent}
				</Text>
			);
		}

		return renderMessageContent;
	}

	const isPreview = props.tmid && !props.isThreadRoom;
	let content = null;

	if (props.tmid && !props.msg) {
		content = <Text style={[styles.text, { color: themes[props.theme].bodyText }]}>{I18n.t('Sent_an_attachment')}</Text>;
	} else if (props.isEncrypted) {
		content = <Text style={[styles.textInfo, { color: themes[props.theme].auxiliaryText }]}>{I18n.t('Encrypted_message')}</Text>;
	} else {
		const { baseUrl, user, onLinkPress } = useContext(MessageContext);
		content = (
			<Markdown
				msg={props.msg}
				baseUrl={baseUrl}
				getCustomEmoji={props.getCustomEmoji}
				username={user.username}
				isEdited={props.isEdited}
				numberOfLines={isPreview ? 1 : 0}
				preview={isPreview}
				channels={props.channels}
				mentions={props.mentions}
				navToRoomInfo={props.navToRoomInfo}
				tmid={props.tmid}
				useRealName={props.useRealName}
				theme={props.theme}
				onLinkPress={onLinkPress}
			/>
		);
	}

	// If this is a encrypted message and is not a preview
	if (props.type === E2E_MESSAGE_TYPE && !isPreview) {
		content = (
			<View style={styles.flex}>
				<View style={styles.contentContainer}>
					{content}
				</View>
				<Encrypted
					type={props.type}
					theme={props.theme}
				/>
			</View>
		);
	}

	if (props.isIgnored) {
		content = <Text style={[styles.textInfo, { color: themes[props.theme].auxiliaryText }]}>{I18n.t('Message_Ignored')}</Text>;
	}

	return (
		<View style={props.isTemp && styles.temp}>
			{content}
		</View>
	);
}, (prevProps, nextProps) => {
	if (prevProps.isTemp !== nextProps.isTemp) {
		return false;
	}
	if (prevProps.msg !== nextProps.msg) {
		return false;
	}
	if (prevProps.type !== nextProps.type) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	if (prevProps.isEncrypted !== nextProps.isEncrypted) {
		return false;
	}
	if (prevProps.isIgnored !== nextProps.isIgnored) {
		return false;
	}
	if (!dequal(prevProps.mentions, nextProps.mentions)) {
		return false;
	}
	if (!dequal(prevProps.channels, nextProps.channels)) {
		return false;
	}
	return true;
});

Content.propTypes = {
	isTemp: PropTypes.bool,
	isInfo: PropTypes.bool,
	tmid: PropTypes.string,
	isThreadRoom: PropTypes.bool,
	msg: PropTypes.string,
	theme: PropTypes.string,
	isEdited: PropTypes.bool,
	isEncrypted: PropTypes.bool,
	getCustomEmoji: PropTypes.func,
	channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	navToRoomInfo: PropTypes.func,
	useRealName: PropTypes.bool,
	isIgnored: PropTypes.bool,
	type: PropTypes.string
};
Content.displayName = 'MessageContent';

export default Content;
