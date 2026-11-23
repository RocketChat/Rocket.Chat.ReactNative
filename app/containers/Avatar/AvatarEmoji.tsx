import { StyleSheet, Text } from 'react-native';

import CustomEmoji from '~/containers/EmojiPicker/CustomEmoji';
import { useCustomEmoji } from '~/lib/hooks/useCustomEmoji';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import useShortnameToUnicode from '~/lib/hooks/useShortnameToUnicode';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

interface IAvatarEmojiProps {
	emoji: string;
	style: { width: number; height: number; borderRadius: number };
}

const styles = StyleSheet.create({
	emoji: {
		...sharedStyles.textRegular,
		textAlign: 'center',
		textAlignVertical: 'center'
	}
});

const AvatarEmoji = ({ emoji, style }: IAvatarEmojiProps) => {
	const { colors } = useTheme();
	const getCustomEmoji = useCustomEmoji();
	const { fontScaleLimited } = useResponsiveLayout();
	const { formatShortnameToUnicode } = useShortnameToUnicode();

	const customEmoji = getCustomEmoji(emoji.replace(/:/g, ''));
	if (customEmoji) {
		return <CustomEmoji style={style} emoji={customEmoji} />;
	}

	const size = 30 * fontScaleLimited;
	return (
		<Text style={[styles.emoji, { color: colors.fontDefault, fontSize: size, lineHeight: size }, style]}>
			{formatShortnameToUnicode(emoji)}
		</Text>
	);
};

export default AvatarEmoji;
