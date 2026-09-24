import Avatar from '~/containers/Avatar';
import NativeListRow from '~/containers/NativeListRow';
import { AVATAR_SIZE } from '~/containers/NativeListRow/constants';
import I18n from '~/i18n';
import { useMediaCallPermission } from '~/lib/hooks/useMediaCallPermission';
import { useIsInActiveVoipCall } from '~/lib/services/voip/isInActiveVoipCall';
import { isSelfUserId } from '~/lib/services/voip/isSelfUserId';
import { useStartMediaCall } from './useStartMediaCall';

interface IItem {
	userId: string;
	name: string;
	username: string;
	onPress(): void;
	testID: string;
	onLongPress?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
}

const Item = ({ userId, name, username, onPress, testID, onLongPress, isFirst, isLast }: IItem) => {
	const hasMediaCallPermission = useMediaCallPermission();
	const isInActiveCall = useIsInActiveVoipCall();
	const isSelf = isSelfUserId(userId);
	const startMediaCall = useStartMediaCall({ userId, name, username });

	return (
		<NativeListRow
			title={name}
			onPress={onPress}
			onLongPress={onLongPress}
			testID={testID}
			accessibilityLabel={name}
			isFirst={isFirst}
			isLast={isLast}
			leading={<Avatar text={username} size={AVATAR_SIZE} />}
			trailingAction={
				hasMediaCallPermission && !isSelf
					? {
							icon: 'phone',
							onPress: startMediaCall,
							testID: `${testID}-call`,
							accessibilityLabel: I18n.t('Voice_call'),
							disabled: isInActiveCall
						}
					: undefined
			}
		/>
	);
};

export default Item;
