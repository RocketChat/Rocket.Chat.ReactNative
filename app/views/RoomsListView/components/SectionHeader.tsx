import * as Haptics from 'expo-haptics';
import { memo, useState } from 'react';
import { type GestureResponderEvent, Pressable, Text, View } from 'react-native';
import { type EntryExitAnimationFunction } from 'react-native-reanimated';

import { CustomIcon } from '~/containers/CustomIcon';
import UnreadBadge from '~/containers/UnreadBadge';
import i18n from '~/i18n';
import { useTheme } from '~/theme';
import styles from '../styles';
import { type IMountFade } from '../hooks/useFadeInOnMount';
import FadeInOnMount from './FadeInOnMount';
import SectionChevron from './SectionChevron';

interface ISectionHeader {
	header: string;
	title?: string;
	collapsed: boolean;
	empty?: boolean;
	unread?: number;
	userMentions?: number;
	groupMentions?: number;
	tunread?: string[];
	tunreadUser?: string[];
	tunreadGroup?: string[];
	onToggle: (header: string, headerBottom: number) => void;
	onOpen: (header: string, title: string) => void;
	badgeFadeIn: IMountFade;
	badgeExiting: EntryExitAnimationFunction;
}

const SectionHeader = ({
	header,
	title,
	collapsed,
	empty,
	unread,
	userMentions,
	groupMentions,
	tunread,
	tunreadUser,
	tunreadGroup,
	onToggle,
	onOpen,
	badgeFadeIn,
	badgeExiting
}: ISectionHeader) => {
	const { colors } = useTheme();
	const [isTogglePressed, setIsTogglePressed] = useState(false);
	const sectionTitle = title ?? i18n.t(header);
	const hasHiddenUnread = collapsed && !!unread;
	const showsCollapsed = collapsed || !!empty;

	const onPressOpen = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onOpen(header, sectionTitle);
	};

	const onPressToggle = (event: GestureResponderEvent) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const { currentTarget } = event;
		if (typeof currentTarget === 'number') {
			return;
		}
		currentTarget.measureInWindow((_x, y, _width, height) => onToggle(header, y + height));
	};

	return (
		<View style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
			<Pressable
				onPress={onPressOpen}
				style={({ pressed }) => [styles.groupTitleButton, (pressed || isTogglePressed) && styles.groupHeaderPressed]}
				accessibilityRole='button'
				accessibilityLabel={sectionTitle}
				accessibilityHint={i18n.t('Open_category')}
				testID={`rooms-list-section-open-${header}`}>
				<Text
					style={[
						styles.groupTitle,
						hasHiddenUnread ? [styles.groupTitleUnread, { color: colors.fontTitlesLabels }] : { color: colors.fontDefault }
					]}
					numberOfLines={1}>
					{sectionTitle}
				</Text>
				<CustomIcon
					name='chevron-right'
					size={20}
					style={styles.groupTitleChevron}
					color={hasHiddenUnread ? colors.fontTitlesLabels : colors.fontDefault}
				/>
			</Pressable>
			<Pressable
				onPress={onPressToggle}
				disabled={empty}
				onPressIn={() => setIsTogglePressed(true)}
				onPressOut={() => setIsTogglePressed(false)}
				style={[styles.groupToggle, isTogglePressed && styles.groupHeaderPressed]}
				accessibilityRole='button'
				accessibilityLabel={i18n.t(showsCollapsed ? 'Expand_category' : 'Collapse_category', { name: sectionTitle })}
				accessibilityState={{ expanded: !showsCollapsed, disabled: empty }}
				testID={`rooms-list-section-${header}`}>
				{collapsed ? (
					<FadeInOnMount fadeIn={badgeFadeIn} exiting={badgeExiting}>
						<UnreadBadge
							unread={unread}
							userMentions={userMentions}
							groupMentions={groupMentions}
							tunread={tunread}
							tunreadUser={tunreadUser}
							tunreadGroup={tunreadGroup}
						/>
					</FadeInOnMount>
				) : null}
				<SectionChevron collapsed={showsCollapsed} color={empty ? colors.fontDisabled : colors.fontDefault} />
			</Pressable>
		</View>
	);
};

export default memo(SectionHeader);
