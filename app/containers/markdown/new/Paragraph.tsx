import React from 'react';
import { StyleProp, Text, ViewStyle } from 'react-native';
import { Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import { UserMention } from '../../message/interfaces';
import Inline from './Inline';
import styles from '../styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../constants/colors';

interface IParagraphProps {
	value: ParagraphProps['value'];
	mentions?: UserMention[];
	channels?: {
		name: string;
		_id: number;
	}[];
	navToRoomInfo?: Function;
	style?: StyleProp<ViewStyle>[];
	useRealName?: boolean;
	username?: string;
}

const Paragraph = ({ value, mentions, channels, useRealName, username, navToRoomInfo, style }: IParagraphProps): JSX.Element => {
	const { theme } = useTheme();
	return (
		<Text style={[styles.text, style, { color: themes[theme].bodyText }]}>
			<Inline
				value={value}
				useRealName={useRealName}
				username={username}
				mentions={mentions}
				channels={channels}
				navToRoomInfo={navToRoomInfo}
				style={style}
			/>
		</Text>
	);
};

export default Paragraph;
