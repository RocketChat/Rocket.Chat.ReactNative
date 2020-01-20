import React, { useContext } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import shortnameToUnicode from '../../../utils/shortnameToUnicode';
import styles from '../styles';
import MessageboxContext from '../Context';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';

const MentionEmoji = ({ item }) => {
	const context = useContext(MessageboxContext);
	const { baseUrl } = context;

	if (item.name) {
		return (
			<CustomEmoji
				style={styles.mentionItemCustomEmoji}
				emoji={item}
				baseUrl={baseUrl}
			/>
		);
	}
	return (
		<Text style={styles.mentionItemEmoji}>
			{shortnameToUnicode(`:${ item }:`)}
		</Text>
	);
};

MentionEmoji.propTypes = {
	item: PropTypes.object
};

export default MentionEmoji;
