import * as Haptics from 'expo-haptics';
import { HStack, Host, ScrollView, useNativeState } from '@expo/ui/swift-ui';
import { padding, scrollPosition, scrollTargetLayout } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import { type ISectionPills } from './types';
import SectionPill from './SectionPill';

const SectionPills = ({ sections, selectedHeader, onSelect }: ISectionPills) => {
	const { colors } = useTheme();
	const scrolledHeader = useNativeState<string | null>(selectedHeader);

	const selectWithHaptic = (header: string, title: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onSelect(header, title);
	};

	return (
		<Host matchContents={{ vertical: true }} style={{ backgroundColor: colors.surfaceTint }}>
			<ScrollView axes='horizontal' showsIndicators={false} modifiers={[scrollPosition(scrolledHeader, { anchor: 'leading' })]}>
				<HStack spacing={8} modifiers={[scrollTargetLayout(), padding({ horizontal: 16, top: 16, bottom: 8 })]}>
					{sections.map(({ header, title }) => (
						<SectionPill
							key={header}
							header={header}
							title={title}
							selected={header === selectedHeader}
							onSelect={selectWithHaptic}
						/>
					))}
				</HStack>
			</ScrollView>
		</Host>
	);
};

export default SectionPills;
