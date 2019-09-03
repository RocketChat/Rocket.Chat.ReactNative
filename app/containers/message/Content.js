import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../i18n';
import styles from './styles';
import Markdown from '../markdown';
import { getInfoMessage } from './utils';

const Content = React.memo((props) => {
	if (props.isInfo) {
		return <Text style={styles.textInfo}>{getInfoMessage({ ...props })}</Text>;
	}

	let content = null;

	if (props.tmid && !props.msg) {
		content = <Text style={styles.text}>{I18n.t('Sent_an_attachment')}</Text>;
	} else {
		content = (
			<Markdown
				msg={props.msg}
				baseUrl={props.baseUrl}
				getCustomEmoji={props.getCustomEmoji}
				username={props.user.username}
				isEdited={props.isEdited}
				numberOfLines={props.tmid ? 1 : 0}
				channels={props.channels}
				mentions={props.mentions}
				useMarkdown={props.useMarkdown && !props.tmid}
				navToRoomInfo={props.navToRoomInfo}
				tmid={props.tmid}
			/>
		);
	}

	return (
		<View style={props.isTemp && styles.temp}>
			{content}
		</View>
	);
}, (prevProps, nextProps) => prevProps.isTemp === nextProps.isTemp && prevProps.msg === nextProps.msg);

Content.propTypes = {
	isTemp: PropTypes.bool,
	isInfo: PropTypes.bool,
	tmid: PropTypes.string,
	msg: PropTypes.string,
	isEdited: PropTypes.bool,
	useMarkdown: PropTypes.bool,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	getCustomEmoji: PropTypes.func,
	channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	navToRoomInfo: PropTypes.func
};
Content.displayName = 'MessageContent';

export default Content;
