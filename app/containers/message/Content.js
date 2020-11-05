import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';
import equal from 'deep-equal';

import I18n from '../../i18n';
import styles from './styles';
import Markdown from '../markdown';
import { getInfoMessage } from './utils';
import { themes } from '../../constants/colors';
import MessageContext from './Context';
import Encrypted from './Encrypted';
import { E2E_MESSAGE_TYPE } from '../../lib/encryption/constants';

const Content = React.memo((props) => {
	if (props.isInfo) {
		const infoMessage = getInfoMessage({ ...props });
		return (
			<Text
				style={[styles.textInfo, { color: themes[props.theme].auxiliaryText }]}
				accessibilityLabel={infoMessage}
			>{infoMessage}
			</Text>
		);
	}

	const isPreview = props.tmid && !props.isThreadRoom;
	let content = null;

	if (props.tmid && !props.msg) {
		content = <Text style={[styles.text, { color: themes[props.theme].bodyText }]}>{I18n.t('Sent_an_attachment')}</Text>;
	} else if (props.isEncrypted) {
		content = <Text style={[styles.textInfo, { color: themes[props.theme].auxiliaryText }]}>{I18n.t('Encrypted_message')}</Text>;
	} else {
		const { baseUrl, user } = useContext(MessageContext);
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
	if (!equal(prevProps.mentions, nextProps.mentions)) {
		return false;
	}
	if (!equal(prevProps.channels, nextProps.channels)) {
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
	type: PropTypes.string
};
Content.displayName = 'MessageContent';

export default Content;
