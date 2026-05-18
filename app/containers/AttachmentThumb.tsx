import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { CustomIcon } from './CustomIcon';
import { useTheme } from '../theme';

const SIZE = 64;

const styles = StyleSheet.create({
	base: {
		width: SIZE,
		height: SIZE,
		borderRadius: 4,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1
	}
});

interface IAttachmentThumb {
	path: string;
	mime?: string;
}

export const AttachmentThumb = ({ path, mime }: IAttachmentThumb) => {
	const { colors } = useTheme();

	if (mime?.startsWith('image/')) {
		return <Image source={{ uri: path }} style={[styles.base, { borderColor: colors.strokeLight }]} />;
	}

	return (
		<View style={[styles.base, { borderColor: colors.strokeLight, backgroundColor: colors.surfaceNeutral }]}>
			<CustomIcon name={mime?.startsWith('video/') ? 'video' : 'attach'} size={28} color={colors.badgeBackgroundLevel2} />
		</View>
	);
};
