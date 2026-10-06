import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { useTheme } from '~/theme';
import { type ISectionPills } from './types';
import SectionPill from './SectionPill';

const HORIZONTAL_PADDING = 16;

const SectionPills = ({ sections, selectedHeader, onSelect }: ISectionPills) => {
	const { colors } = useTheme();
	const scrollViewRef = useRef<ScrollView>(null);
	const [initialHeader] = useState(selectedHeader);

	const scrollToInitialSelection = (event: LayoutChangeEvent) =>
		scrollViewRef.current?.scrollTo({ x: event.nativeEvent.layout.x - HORIZONTAL_PADDING, animated: false });

	const selectWithHaptic = (header: string, title: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onSelect(header, title);
	};

	return (
		<ScrollView
			ref={scrollViewRef}
			horizontal
			showsHorizontalScrollIndicator={false}
			accessibilityRole='tablist'
			style={{ backgroundColor: colors.surfaceTint }}
			contentContainerStyle={styles.content}
			testID='category-view-sections'>
			{sections.map(({ header, title }) => (
				<View key={header} onLayout={header === initialHeader ? scrollToInitialSelection : undefined}>
					<SectionPill header={header} title={title} selected={header === selectedHeader} onSelect={selectWithHaptic} />
				</View>
			))}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	content: {
		gap: 8,
		paddingHorizontal: HORIZONTAL_PADDING,
		paddingTop: 16,
		paddingBottom: 8,
		alignItems: 'center'
	}
});

export default SectionPills;
