import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { type EntryExitAnimationFunction } from 'react-native-reanimated';

import { CustomIcon } from '~/containers/CustomIcon';
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
	onOpen: (header: string, title: string) => void;
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
	onOpen,
	badgeEntering,
	badgeExiting
}: ISectionHeader) => {
	const { colors } = useTheme();
	const sectionTitle = title ?? i18n.t(header);
	return (
		<View style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
			<Pressable
				onPress={() => onOpen(header, sectionTitle)}
				style={styles.groupTitleButton}
				accessibilityRole='button'
				accessibilityLabel={sectionTitle}
				accessibilityHint={i18n.t('Open_category')}
				testID={`rooms-list-section-open-${header}`}>
				<Text style={[styles.groupTitle, { color: colors.fontDefault }]} numberOfLines={1}>
					{sectionTitle}
				</Text>
				<CustomIcon name='chevron-right' size={20} color={colors.fontDefault} />
			</Pressable>
			<Pressable
				onPress={event => event.currentTarget.measureInWindow((_x, y, _width, height) => onToggle(header, y + height))}
				style={styles.groupToggle}
				accessibilityRole='button'
				accessibilityLabel={i18n.t(collapsed ? 'Expand_category' : 'Collapse_category', { name: sectionTitle })}
				accessibilityState={{ expanded: !collapsed }}
				testID={`rooms-list-section-${header}`}>
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
		</View>
	);
};

export default memo(SectionHeader);
