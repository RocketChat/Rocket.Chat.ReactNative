import React from 'react';
import { Text } from 'react-native';

import I18n from '../../i18n';
import styles from './styles';
import { getInfoMessage } from './utils';

const Content = React.memo((props) => {
	console.log('TCL: props.isInfo', props.isInfo);
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

export default Content;
