import { View } from 'react-native';
import { type ReactElement } from 'react';

import NativeListRow from '~/containers/NativeListRow';
import NativeListIcon from '~/containers/List/native/Icon.ios';
import NativeListIndicator from '~/containers/List/native/Indicator.ios';
import RowSeparator from '~/containers/NativeListRow/Separator';
import i18n from '~/i18n';
import { useTheme } from '~/theme';
import { type IActionsSection, useMemberActions } from './useMemberActions';

export default function ActionsSection(props: IActionsSection): ReactElement | null {
	const { colors } = useTheme();
	const actions = useMemberActions(props);

	if (!actions.length) {
		return null;
	}

	return (
		<View style={{ paddingTop: 16, paddingBottom: 24 }}>
			{actions.map((action, index) => (
				<View key={action.testID}>
					{index > 0 ? <RowSeparator /> : null}
					<NativeListRow
						title={i18n.t(action.title)}
						onPress={action.onPress}
						testID={action.testID}
						accessibilityLabel={action.disabledReason ?? i18n.t(action.title)}
						disabled={action.disabled}
						isFirst={index === 0}
						isLast={index === actions.length - 1}
						leading={<NativeListIcon name={action.icon} color={colors.fontDefault} />}
						trailing={<NativeListIndicator indicator='disclosure' />}
					/>
				</View>
			))}
		</View>
	);
}
