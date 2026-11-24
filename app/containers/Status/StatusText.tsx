import { type ReactElement } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';

import Markdown from '~/containers/markdown';

const IMAGE_MARKDOWN = /!\[([^\]]*)\]\([^)]*\)/g;

export const stripMarkdownImages = (text: string): string => text.replace(IMAGE_MARKDOWN, '$1');

interface IStatusText {
	msg: string;
	textStyle?: StyleProp<TextStyle>;
}

const StatusText = ({ msg, textStyle }: IStatusText): ReactElement => (
	<Markdown msg={stripMarkdownImages(msg)} textStyle={textStyle} />
);

export default StatusText;
