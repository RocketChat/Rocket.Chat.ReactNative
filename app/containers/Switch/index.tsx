import { AccessibilityInfo, Switch as RNSwitch, type SwitchProps } from 'react-native';
import { type ReactElement } from 'react';

import { useTheme } from '~/theme';
import { isIOS } from '~/lib/methods/helpers';
import I18n from '~/i18n';
import { useIsNativeList } from '~/containers/List/native/context';
import NativeListToggle from '~/containers/List/native/components/Toggle';

const Switch = (props: SwitchProps): ReactElement => {
	const { colors } = useTheme();
	const isNativeList = useIsNativeList();

	if (isNativeList) {
		return (
			<NativeListToggle
				value={Boolean(props.value)}
				onValueChange={props.onValueChange ?? undefined}
				disabled={Boolean(props.disabled)}
				testID={props.testID}
				tintColor={colors.buttonBackgroundPrimaryDefault}
			/>
		);
	}

	const trackColor = {
		false: colors.strokeDark,
		true: colors.buttonBackgroundPrimaryDefault
	};

	const onValueChange = (value: boolean) => {
		props?.onValueChange?.(value);
		if (isIOS) {
			AccessibilityInfo.announceForAccessibility(I18n.t(value ? 'Enabled' : 'Disabled'));
		}
	};

	return (
		<RNSwitch
			onValueChange={onValueChange}
			trackColor={trackColor}
			thumbColor={colors.fontPureWhite}
			ios_backgroundColor={colors.strokeDark}
			{...props}
		/>
	);
};

export default Switch;
