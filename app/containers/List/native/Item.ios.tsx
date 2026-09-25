import { type ReactNode } from 'react';
import { Button, HStack, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	listRowInsets,
	opacity,
	shapes
} from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import NativeListAccessory from './Accessory.ios';
import NativeListIcon from './Icon.ios';
import NativeListIndicator from './Indicator.ios';
import { type IListItem } from '../ListItem';
import { type INativeListItem } from './types';
import { describeNativeListAccessory } from './describeAccessory';
import { BASE_HEIGHT, PADDING_HORIZONTAL } from '../constants';
import { nativeListItemAccessibilityLabel, nativeListItemSubtitle, nativeListItemTitle, pressNativeListItem } from './itemProps';

const NativeListItemTitle = ({ item }: { item: IListItem }) => {
	const { colors } = useTheme();
	const title = nativeListItemTitle(item);

	if (typeof item.title === 'function') {
		const customTitle = item.title();
		return customTitle ? <RNHostView matchContents>{customTitle}</RNHostView> : null;
	}
	return (
		<HStack spacing={4}>
			<Text
				modifiers={[
					item.numberOfLines ? lineLimit(item.numberOfLines) : lineLimit(),
					font({ textStyle: 'body', weight: 'medium' }),
					foregroundStyle(item.color ?? colors.fontDefault)
				]}>
				{title}
			</Text>
			{item.alert ? <NativeListIcon name='info' color={colors.buttonBackgroundDangerDefault} /> : null}
		</HStack>
	);
};

const NativeListItemRow = ({ item, children }: { item: IListItem; children: ReactNode }) => {
	const { fontScale } = useResponsiveLayout();
	const rowModifiers = [
		accessibilityLabel(nativeListItemAccessibilityLabel(item)),
		frame({ minHeight: (item.heightContainer ?? BASE_HEIGHT) * fontScale }),
		listRowInsets({ leading: PADDING_HORIZONTAL, trailing: PADDING_HORIZONTAL }),
		...(item.disabled ? [opacity(0.3)] : [])
	];

	if (!item.onPress) {
		return (
			<HStack spacing={12} testID={item.testID} modifiers={rowModifiers}>
				{children}
			</HStack>
		);
	}
	return (
		<Button onPress={() => pressNativeListItem(item)} testID={item.testID} modifiers={[buttonStyle('plain'), ...rowModifiers]}>
			<HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
				{children}
			</HStack>
		</Button>
	);
};

const NativeListItem = ({ item }: INativeListItem) => {
	const { colors } = useTheme();
	const subtitle = nativeListItemSubtitle(item);
	const leading = describeNativeListAccessory(item.left?.());
	const trailing = describeNativeListAccessory(item.right?.());

	return (
		<NativeListItemRow item={item}>
			{leading ? <NativeListAccessory accessory={leading} /> : null}
			<VStack alignment='leading' spacing={2}>
				<NativeListItemTitle item={item} />
				{subtitle ? (
					<Text modifiers={[lineLimit(1), font({ textStyle: 'subheadline' }), foregroundStyle(colors.fontSecondaryInfo)]}>
						{subtitle}
					</Text>
				) : null}
			</VStack>
			<Spacer />
			{trailing ? <NativeListAccessory accessory={trailing} /> : null}
			{item.showActionIndicator ? <NativeListIndicator indicator='disclosure' /> : null}
		</NativeListItemRow>
	);
};

export default NativeListItem;
