import React from 'react';
import { Text } from 'react-native';

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

	// return <Text>{props.msg}</Text>;
	return (
		<Markdown
			msg={props.msg}
			baseUrl={props.baseUrl}
			username={props.user.username}
			edited={props.edited}
			numberOfLines={props.tmid ? 1 : 0}
		/>
	);
});
Content.displayName = 'MessageContent';

export default Content;
