import React from 'react';
import { Text, Clipboard } from 'react-native';
import PropTypes from 'prop-types';

import Strike from './Strike';
import Italic from './Italic';
import Bold from './Bold';
import styles from '../styles';
import I18n from '../../../i18n';
import { LISTENER } from '../../Toast';
import { useTheme } from '../../../theme';
import openLink from '../../../utils/openLink';
import EventEmitter from '../../../utils/events';
import { themes } from '../../../constants/colors';

const Link = ({ value }) => {
	const { theme } = useTheme();
	const { src, label } = value;
	const handlePress = () => {
		if (!src.value) {
			return;
		}
		openLink(src.value, theme);
	};

	const onLongPress = () => {
		Clipboard.setString(src.value);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	return (
		<Text
			onPress={handlePress}
			onLongPress={onLongPress}
			o
			style={{ ...styles.link, color: themes[theme].actionTintColor }}
		>
			{((block) => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return block.value;
					case 'STRIKE':
						return <Strike value={block.value} />;
					case 'ITALIC':
						return <Italic value={block.value} />;
					case 'BOLD':
						return <Bold value={block.value} />;
					default:
						return null;
				}
			})(label)}
		</Text>
	);
};

Link.propTypes = {
	value: {
		src: PropTypes.string,
		label: PropTypes.string
	}
};

export default Link;
