import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import shortnameToUnicode from '../../../utils/shortnameToUnicode';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import styles from '../styles';

const Emoji = ({ emojiHandle, style, isBigEmoji }) => {
	const { theme } = useTheme();
	const emojiUnicode = shortnameToUnicode(emojiHandle);
	return (
		<Text
			style={[
				{ color: themes[theme].bodyText },
				isBigEmoji ? styles.textBig : styles.text,
				style
			]}
		>
			{emojiUnicode}
		</Text>
	);
};

Emoji.propTypes = {
	emojiHandle: PropTypes.string,
	style: PropTypes.object,
	isBigEmoji: PropTypes.bool
};

export default Emoji;
