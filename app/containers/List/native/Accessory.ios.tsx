import { Checkbox } from '@expo/ui';
import { Image, RNHostView, Text, Toggle } from '@expo/ui/swift-ui';
import { disabled, font, foregroundStyle, labelsHidden, lineLimit, tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import NativeListIcon from './Icon.ios';
import NativeListStatus from './Status.ios';
import { type TNativeListAccessory } from './describeAccessory';

const NativeListAccessory = ({ accessory }: { accessory: TNativeListAccessory }) => {
	const { colors } = useTheme();

	switch (accessory.kind) {
		case 'icon':
			return <NativeListIcon name={accessory.name} color={accessory.color ?? colors.fontDefault} size={accessory.size} />;
		case 'check':
			return (
				<Image
					systemName='checkmark'
					color={colors.badgeBackgroundLevel2}
					modifiers={[font({ textStyle: 'body', weight: 'semibold' })]}
				/>
			);
		case 'status':
			return <NativeListStatus status={accessory.status} />;
		case 'toggle':
			return (
				<Toggle
					isOn={accessory.isOn}
					onIsOnChange={accessory.onValueChange}
					testID={accessory.testID}
					modifiers={[labelsHidden(), tint(colors.buttonBackgroundPrimaryDefault), disabled(accessory.disabled)]}
				/>
			);
		case 'checkbox':
			return (
				<Checkbox
					value={accessory.value}
					onValueChange={accessory.onValueChange}
					testID={accessory.testID}
					modifiers={[labelsHidden(), tint(colors.strokeHighlight)]}
				/>
			);
		case 'text':
			return (
				<Text modifiers={[lineLimit(1), font({ textStyle: 'body' }), foregroundStyle(colors.fontSecondaryInfo)]}>
					{accessory.text}
				</Text>
			);
		case 'hosted':
			return <RNHostView matchContents>{accessory.element}</RNHostView>;
	}
};

export default NativeListAccessory;
