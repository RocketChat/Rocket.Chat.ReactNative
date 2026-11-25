import { StyleSheet } from 'react-native';

import Emoji from '../message/components/Emoji';
import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	emoji: {
		...sharedStyles.textRegular,
		textAlign: 'center',
		textAlignVertical: 'center'
	}
});

const AVATAR_EMOJI_FONT_SIZE = 30;

interface IAvatarEmojiProps {
	emoji: string;
	avatarStyle: { width: number; height: number; borderRadius: number };
}

const AvatarEmoji = ({ emoji, avatarStyle }: IAvatarEmojiProps) => {
	const { colors } = useTheme();
	const { fontScaleLimited } = useResponsiveLayout();
	const emojiFontSize = AVATAR_EMOJI_FONT_SIZE * fontScaleLimited;

	return (
		<Emoji
			content={emoji}
			standardEmojiStyle={[
				styles.emoji,
				{ color: colors.fontDefault, fontSize: emojiFontSize, lineHeight: emojiFontSize },
				avatarStyle
			]}
			customEmojiStyle={avatarStyle}
		/>
	);
};

export default AvatarEmoji;
