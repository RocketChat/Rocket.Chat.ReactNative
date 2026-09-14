import { useLayoutEffect, useMemo } from 'react';
import { useActionSheet } from '~/containers/ActionSheet';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import i18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers';
import { headerItems, type HeaderAction } from '~/lib/methods/helpers/navigation';
import { headerMenuAction } from '~/lib/methods/helpers/navigation/headerItems';
import { type TRoomStackNavigation } from '~/views/RoomView/services/navigateToScreen';
import { useHeaderCallAction } from '../useHeaderCallAction';

interface IApplyRoomHeaderItems {
	navigation: TRoomStackNavigation;
	actions: HeaderAction[];
}

export const ApplyRoomHeaderItems = ({ navigation, actions }: IApplyRoomHeaderItems) => {
	const { showActionSheet } = useActionSheet();
	useLayoutEffect(() => {
		if (actions.length > 1 && actions.every(action => action.type === 'button')) {
			const searchActions = isIOS ? actions.filter(action => action.iconName === 'search') : [];
			const menuActions = actions.filter(action => !searchActions.includes(action));
			const unreadAction = actions.find(action => action.badge);
			navigation.setOptions(
				headerItems({
					right: [
						...searchActions,
						{
							type: 'menu',
							label: i18n.t('More'),
							accessibilityLabel: i18n.t('More'),
							icon: { type: 'sfSymbol', name: 'ellipsis' },
							badge: unreadAction?.badge,
							menu: { items: menuActions.map(headerMenuAction) },
							androidElement: (
								<HeaderButton.Item
									iconName='kebab'
									accessibilityLabel={i18n.t('More')}
									testID='room-view-header-more'
									badge={unreadAction?.androidBadge}
									onPress={() =>
										showActionSheet({
											options: menuActions.map(action => ({
												title: action.label,
												icon: action.iconName,
												onPress: action.onPress,
												enabled: !action.disabled,
												testID: action.testID
											}))
										})
									}
								/>
							)
						}
					]
				})
			);
			return;
		}
		navigation.setOptions(headerItems({ right: actions }));
	}, [navigation, actions, showActionSheet]);
	return null;
};

export const RoomHeaderItemsWithCall = ({
	navigation,
	beforeCall,
	afterCall,
	rid,
	disabled,
	accessibilityLabel
}: {
	navigation: TRoomStackNavigation;
	beforeCall: HeaderAction[];
	afterCall: HeaderAction[];
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
}) => {
	const call = useHeaderCallAction({ rid, disabled, accessibilityLabel });
	const actions = useMemo(() => [...beforeCall, ...(call ? [call] : []), ...afterCall], [beforeCall, call, afterCall]);
	return <ApplyRoomHeaderItems navigation={navigation} actions={actions} />;
};
