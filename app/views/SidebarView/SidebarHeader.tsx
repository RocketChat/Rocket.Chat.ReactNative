import React from 'react';
import { View, Text, Pressable as RNPressable } from 'react-native';
import { withKeyboardFocus } from 'react-native-external-keyboard';

import Avatar from '../../containers/Avatar';
import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import styles from './styles';

const Pressable = withKeyboardFocus(RNPressable);

export default function SidebarHeader({
	username,
	name,
	useRealName,
	baseUrl,
	siteName,
	disabled,
	onPress
}: {
	username: string;
	name?: string;
	useRealName: boolean;
	disabled: boolean;
	baseUrl: string;
	siteName: string;
	onPress: () => void;
}) {
	const { theme } = useTheme();
	return (
		<Pressable
			focusable={!disabled}
			autoFocus={!disabled}
			disabled={disabled}
			onPress={onPress}
			testID='sidebar-close-drawer'
			style={[styles.header, { backgroundColor: themes[theme!].surfaceRoom }]}>
			<Avatar text={username} style={styles.avatar} size={30} />
			<View style={styles.headerTextContainer}>
				<View style={styles.headerUsername}>
					<Text numberOfLines={1} style={[styles.username, { color: themes[theme!].fontTitlesLabels }]}>
						{useRealName ? name : username}
					</Text>
				</View>
				<Text
					style={[styles.currentServerText, { color: themes[theme!].fontTitlesLabels }]}
					numberOfLines={1}
					accessibilityLabel={`Connected to ${baseUrl}`}>
					{siteName}
				</Text>
			</View>
		</Pressable>
	);
}
