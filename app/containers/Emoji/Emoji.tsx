import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import type { StyleProp, TextStyle, ImageStyle } from 'react-native';

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


    // Calculate emoji sizes once to avoid duplication
    const customEmojiSize = {
        width: 15 * fontScale,
        height: 15 * fontScale
    };
    const customEmojiBigSize = {
        width: 30 * fontScale,
        height: 30 * fontScale
    };

    if (customEmoji) {
        return <CustomEmoji style={[isBigEmoji ? customEmojiBigSize : customEmojiSize, style as StyleProp<ImageStyle>]} emoji={customEmoji} />;
    }

    if (!literal) {
        return null;
    }

    const emojiUnicode = formatShortnameToUnicode(literal);
    const emojiName = literal.replace(/:/g, '');
    const foundCustomEmoji = getCustomEmoji?.(emojiName);

    if (foundCustomEmoji) {
        return <CustomEmoji style={[isBigEmoji ? customEmojiBigSize : customEmojiSize, style as StyleProp<ImageStyle>]} emoji={foundCustomEmoji} />;
    }

    const avatarStyle = {
        fontSize: 30 * fontScaleLimited,
        lineHeight: 30 * fontScaleLimited,
        textAlign: 'center' as const
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
