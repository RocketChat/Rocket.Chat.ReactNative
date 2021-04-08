
import React from 'react';
import * as HeaderButton from '../../../containers/HeaderButton';
import { logEvent, events } from '../../../utils/log';
import I18n from '../../../i18n';

const Header = (roomUser, room, showEdit, navigation, route) => {
	const t = route.params?.t;
	const rid = route.params?.rid;
	const showCloseModal = route.params?.showCloseModal;
	let headerLeft;

	if (showCloseModal) {
		headerLeft = <HeaderButton.CloseModal navigation={navigation} />;
	}

	let headerRight;

	if (showEdit) {
		headerRight = () => (
			<HeaderButton.Container>
				<HeaderButton.Item
					iconName='edit'
					onPress={() => {
						const isLivechat = t === 'l';
						logEvent(events[`RI_GO_${ isLivechat ? 'LIVECHAT' : 'RI' }_EDIT`]);
						navigation.navigate(isLivechat ? 'LivechatEditView' : 'RoomInfoEditView', { rid, room, roomUser });
					}}
					testID='room-info-view-edit-button'
				/>
			</HeaderButton.Container>
		);
	}

	let title = I18n.t('Room_Info');

	if (t === 'd') {
		title = I18n.t('User_Info');
	}

	navigation.setOptions({
		headerLeft,
		title,
		headerRight
	});
};

export default Header;
