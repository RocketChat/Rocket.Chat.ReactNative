import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../i18n';
import styles from './styles';
import Markdown from './Markdown';
import { getInfoMessage } from './utils';

const Content = React.memo((props) => {
	if (props.isInfo) {
		return <Text style={styles.textInfo}>{getInfoMessage({ ...props })}</Text>;
	}

	if (props.tmid && !props.msg) {
		return <Text style={styles.text}>{I18n.t('Sent_an_attachment')}</Text>;
	}

	return (
		<Markdown
			msg={props.msg}
			baseUrl={props.baseUrl}
			username={props.user.username}
			isEdited={props.isEdited}
			mentions={props.mentions}
			channels={props.channels}
			numberOfLines={props.tmid ? 1 : 0}
			getCustomEmoji={props.getCustomEmoji}
			useMarkdown={props.useMarkdown}
		/>
	);
}, (prevProps, nextProps) => prevProps.msg === nextProps.msg);

Content.propTypes = {
	isInfo: PropTypes.bool,
	isEdited: PropTypes.bool,
	useMarkdown: PropTypes.bool,
	tmid: PropTypes.string,
	msg: PropTypes.string,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	getCustomEmoji: PropTypes.func
};
Content.displayName = 'MessageContent';

export default Content;
