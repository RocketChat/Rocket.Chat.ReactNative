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
    const unicodeEmoji = formatShortnameToUnicode(`:${emoji}:`);
    return <Text style={[{ fontSize: size }, style as StyleProp<TextStyle>]}>{unicodeEmoji}</Text>;
  }

  return (
    <CustomEmoji
      style={[{ width: size, height: size }, style as StyleProp<ImageStyle>]}
      emoji={emoji}
    />
  );
};

export default Emoji;
