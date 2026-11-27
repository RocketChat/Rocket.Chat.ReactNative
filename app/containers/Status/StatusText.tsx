import { type ReactElement } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';

import Markdown from '~/containers/markdown';

interface IStatusText {
	msg: string;
	textStyle?: StyleProp<TextStyle>;
}

const StatusText = ({ msg, textStyle }: IStatusText): ReactElement => (
	<Markdown msg={msg} textStyle={textStyle} allowImages={false} />
);

export default StatusText;
