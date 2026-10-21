import { memo } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { type EntryExitAnimationFunction } from 'react-native-reanimated';

import UnreadBadge from '~/containers/UnreadBadge';
import i18n from '~/i18n';
import { useTheme } from '~/theme';
import styles from '../styles';
import SectionChevron from './SectionChevron';

interface ISectionHeader {
	header: string;
	title?: string;
	collapsed: boolean;
	unread?: number;
	userMentions?: number;
	groupMentions?: number;
	tunread?: string[];
	tunreadUser?: string[];
	tunreadGroup?: string[];
	onToggle: (header: string, headerBottom: number) => void;
	badgeEntering: EntryExitAnimationFunction;
	badgeExiting: EntryExitAnimationFunction;
}

const SectionHeader = ({
	header,
	title,
	collapsed,
	unread,
	userMentions,
	groupMentions,
	tunread,
	tunreadUser,
	tunreadGroup,
	onToggle,
	badgeEntering,
	badgeExiting
}: ISectionHeader) => {
	const { colors } = useTheme();
	const sectionTitle = title ?? i18n.t(header);
	return (
		<Pressable
			onPress={event => event.currentTarget.measureInWindow((_x, y, _width, height) => onToggle(header, y + height))}
			style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}
			accessibilityRole='button'
			accessibilityLabel={sectionTitle}
			accessibilityState={{ expanded: !collapsed }}
			testID={`rooms-list-section-${header}`}>
			<Text style={[styles.groupTitle, { color: colors.fontDefault }]}>{sectionTitle}</Text>
			{collapsed ? (
				<Animated.View entering={badgeEntering} exiting={badgeExiting}>
					<UnreadBadge
						unread={unread}
						userMentions={userMentions}
						groupMentions={groupMentions}
						tunread={tunread}
						tunreadUser={tunreadUser}
						tunreadGroup={tunreadGroup}
					/>
				</Animated.View>
			) : null}
			<SectionChevron collapsed={collapsed} />
		</Pressable>
	);
};

export default memo(SectionHeader);
