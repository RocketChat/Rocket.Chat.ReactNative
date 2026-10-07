import Avatar from '~/containers/Avatar';
import NativeListRow from '~/containers/NativeListRow';
import { AVATAR_SIZE } from '~/containers/NativeListRow/constants';
import I18n from '~/i18n';
import { useStartMediaCall } from './useStartMediaCall';
import { type IItem } from './Item';

const Item = ({ userId, name, username, onPress, testID, onLongPress, isFirst, isLast }: IItem) => {
	const { canStartMediaCall, isInActiveCall, startMediaCall } = useStartMediaCall({ userId, name, username });

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
				canStartMediaCall
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
