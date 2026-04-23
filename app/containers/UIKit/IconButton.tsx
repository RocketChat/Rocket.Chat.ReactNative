import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { type BlockContext } from '@rocket.chat/ui-kit';

import ActivityIndicator from '../ActivityIndicator';
import { BUTTON_HIT_SLOP } from '../message/utils';
import openLink from '../../lib/methods/helpers/openLink';
import { useTheme } from '../../theme';
import { useBlockContext } from './utils';
import { Icon } from './Icon';
import { type IIconButton, type IText } from './interfaces';

const styles = StyleSheet.create({
	button: {
		width: 32,
		height: 32,
		borderWidth: 1,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center'
	},
	loading: {
		padding: 0
	}
});

const getLabel = (label?: string | IText, fallback?: string) => {
	if (typeof label === 'string') {
		return label;
	}

	if (label?.text) {
		return label.text;
	}

	return fallback || 'icon button';
};

export const IconButton = ({ element, context }: { element: IIconButton; context: BlockContext }) => {
	const { theme, colors } = useTheme();
	const [{ loading }, action] = useBlockContext(element, context);
	const label = getLabel(element.label, element.icon?.icon);

	const onPress = async () => {
		if (element.url) {
			await Promise.allSettled([action({ value: element.value }), openLink(element.url, theme)]);
			return;
		}

		await action({ value: element.value });
	};

	return (
		<Pressable
			onPress={onPress}
			disabled={loading}
			hitSlop={BUTTON_HIT_SLOP}
			android_ripple={{ color: colors.surfaceNeutral, borderless: false }}
			style={({ pressed }) => [
				styles.button,
				{
					borderColor: colors.strokeLight,
					backgroundColor: colors.surfaceLight,
					opacity: pressed ? 0.7 : 1
				}
			]}
			accessibilityRole={element.url ? 'link' : 'button'}
			accessibilityLabel={label}>
			{loading ? <ActivityIndicator style={styles.loading} /> : <Icon element={element.icon} />}
		</Pressable>
	);
};
