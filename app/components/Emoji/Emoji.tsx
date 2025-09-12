import React from 'react';
import { Text, StyleProp, TextStyle, ImageStyle } from 'react-native';

import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import CustomEmoji from '../../containers/EmojiPicker/CustomEmoji';
import { ICustomEmoji } from '../../definitions/IEmoji';

interface IEmojiProps {
	emoji: string | ICustomEmoji;
	style?: StyleProp<TextStyle | ImageStyle>;
	size?: number;
}

const Emoji = ({ emoji, style, size = 16 }: IEmojiProps) => {
	const { formatShortnameToUnicode } = useShortnameToUnicode(true);

	if (typeof emoji === 'string') {
		const trimmed = emoji.trim();

		const isColonShortname = /^:[^:\s]+:$/.test(trimmed);
		const isBareShortname = /^[a-z0-9_+\-]+$/i.test(trimmed);

		const leading = emoji.match(/^\s*/)?.[0] ?? '';
		const trailing = emoji.match(/\s*$/)?.[0] ?? '';

		let converted: string;
		if (isColonShortname) {
			converted = formatShortnameToUnicode(trimmed);
		} else if (isBareShortname) {
			converted = formatShortnameToUnicode(`:${trimmed}:`);
		} else {
			converted = emoji;
		}

		return <Text style={[{ fontSize: size }, style as StyleProp<TextStyle>]}>{`${leading}${converted}${trailing}`}</Text>;
	}

	return <CustomEmoji style={[{ width: size, height: size }, style as StyleProp<ImageStyle>]} emoji={emoji} />;
};

export default Emoji;
