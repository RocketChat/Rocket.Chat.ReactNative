import React from 'react';
import { View } from 'react-native';

import { AvatarWithEdit } from '../../../containers/Avatar';
import Status from '../../../containers/Status';
import { SubscriptionType } from '../../../definitions';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';
import styles from '../styles';

const RoomInfoViewAvatar = ({
	showEdit,
	type,
	username,
	rid,
	handleEditAvatar,
	userId
}: {
	showEdit: boolean;
	type: SubscriptionType;
	username: string;
	rid?: string;
	handleEditAvatar: () => void;
	userId: string;
}): React.ReactElement => {
	const { colors } = useTheme();

	const showAvatarEdit = showEdit && type !== SubscriptionType.OMNICHANNEL;

	return (
		<AvatarWithEdit
			text={username}
			style={styles.avatar}
			type={type}
			rid={rid}
			handleEdit={showAvatarEdit ? handleEditAvatar : undefined}>
			{type === SubscriptionType.DIRECT && userId ? (
				<View style={[sharedStyles.status, { backgroundColor: colors.surfaceHover }]}>
					<Status size={20} id={userId} />
				</View>
			) : null}
		</AvatarWithEdit>
	);
};

export default RoomInfoViewAvatar;
