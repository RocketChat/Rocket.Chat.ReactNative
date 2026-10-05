import { memo } from 'react';
import { Pressable, Text } from 'react-native';

import { CustomIcon } from '~/containers/CustomIcon';
import UnreadBadge from '~/containers/UnreadBadge';
import i18n from '~/i18n';
import { useTheme } from '~/theme';
import styles from '../styles';

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
	onToggle: (header: string) => void;
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
	onToggle
}: ISectionHeader) => {
	const { colors } = useTheme();
	const sectionTitle = title ?? i18n.t(header);
	return (
		<Pressable
			onPress={() => onToggle(header)}
			style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceRoom }]}
			accessibilityRole='button'
			accessibilityLabel={sectionTitle}
			accessibilityState={{ expanded: !collapsed }}
			testID={`rooms-list-section-${header}`}>
			<Text style={[styles.groupTitle, { color: colors.fontHint }]}>{sectionTitle}</Text>
			{collapsed ? (
				<UnreadBadge
					unread={unread}
					userMentions={userMentions}
					groupMentions={groupMentions}
					tunread={tunread}
					tunreadUser={tunreadUser}
					tunreadGroup={tunreadGroup}
				/>
			) : null}
			<CustomIcon
				name={collapsed ? 'chevron-down' : 'chevron-up'}
				size={20}
				color={colors.fontHint}
				style={styles.groupToggleIcon}
			/>
		</Pressable>
	);
};

export default memo(SectionHeader);
