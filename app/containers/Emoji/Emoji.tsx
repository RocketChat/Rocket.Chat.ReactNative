import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { useTheme } from '../../theme';
import useShortnameToUnicode from '../../lib/hooks/useShortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../selectors/login';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface ISharedEmojiProps {
    literal?: string;
    isBigEmoji?: boolean;
    style?: StyleProp<TextStyle>;
    isAvatar?: boolean;
    getCustomEmoji?: (name: string) => any;
    customEmoji?: any;
}

const Emoji = ({ literal, isBigEmoji, style, isAvatar, getCustomEmoji, customEmoji }: ISharedEmojiProps) => {
    const { colors } = useTheme();
    const { formatShortnameToUnicode } = useShortnameToUnicode();
    const { fontScale } = useWindowDimensions();
    const { fontScaleLimited } = useResponsiveLayout();
    const convertAsciiEmoji = useAppSelector(state => getUserSelector(state)?.settings?.preferences?.convertAsciiEmoji);

    if (customEmoji) {
        const customEmojiSize = {
            width: 15 * fontScale,
            height: 15 * fontScale
        };
        const customEmojiBigSize = {
            width: 30 * fontScale,
            height: 30 * fontScale
        };
        return <CustomEmoji style={[isBigEmoji ? customEmojiBigSize : customEmojiSize, style]} emoji={customEmoji} />;
    }

    if (!literal) {
        return null;
    }

    const emojiUnicode = formatShortnameToUnicode(literal);
    const emojiName = literal.replace(/:/g, '');
    const foundCustomEmoji = getCustomEmoji?.(emojiName);

    if (foundCustomEmoji) {
        const customEmojiSize = {
            width: 15 * fontScale,
            height: 15 * fontScale
        };
        const customEmojiBigSize = {
            width: 30 * fontScale,
            height: 30 * fontScale
        };
        return <CustomEmoji style={[isBigEmoji ? customEmojiBigSize : customEmojiSize, style]} emoji={foundCustomEmoji} />;
    }

    // Handle ASCII emojis if needed, though usually handled by parser or formatShortnameToUnicode if configured
    // But here we follow the logic from markdown/components/emoji/Emoji.tsx
    // logic for ASCII is a bit specific to the block structure there, but here we deal with string literal.
    // If formatShortnameToUnicode returns the same string, it might be an ASCII or unknown.

    const avatarStyle = {
        fontSize: 30 * fontScaleLimited,
        lineHeight: 30 * fontScaleLimited,
        textAlign: 'center',
        textAlignVertical: 'center'
    };

    return (
        <Text
            style={[
                { color: colors.fontDefault },
                isBigEmoji ? { fontSize: 30, lineHeight: 43 } : { fontSize: 16, lineHeight: 22 },
                style,
                isAvatar && avatarStyle
            ]}>
            {emojiUnicode}
        </Text>
    );
};

export default Emoji;
