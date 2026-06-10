import React from 'react';

import { AvatarWithEdit } from '../../../containers/Avatar';
import { SubscriptionType } from '../../../definitions';
import styles from '../styles';
import I18n from '../../../i18n';

const RoomInfoViewAvatar = ({
	showEdit,
	type,
	username,
	rid,
	handleEditAvatar
}: {
	showEdit: boolean;
	type: SubscriptionType;
	username: string;
	rid?: string;
	handleEditAvatar: () => void;
}): React.ReactElement => {
	const showAvatarEdit = showEdit && type !== SubscriptionType.OMNICHANNEL;

	return (
		<AvatarWithEdit
			text={username}
			style={styles.avatar}
			type={type}
			rid={rid}
			editAccessibilityLabel={I18n.t('Edit_Room_Photo')}
			handleEdit={showAvatarEdit ? handleEditAvatar : undefined}
		/>
	);
};

export default RoomInfoViewAvatar;
