import React from 'react';

import ActionSheetContentWithInputAndSubmit from '../../../../containers/ActionSheet/ActionSheetContentWithInputAndSubmit';
import I18n from '../../../../i18n';

const CloseLivechatSheet = ({
	onSubmit = () => {},
	onCancel = () => {}
}: {
	onSubmit: (comment: string) => void;
	onCancel: () => void;
}) => (
	<ActionSheetContentWithInputAndSubmit
		title={I18n.t('Closing_chat')}
		description={I18n.t('Please_add_a_comment')}
		onCancel={onCancel}
		onSubmit={onSubmit}
		testID='room-actions-view-close-livechat'
		placeholder=''
		secureTextEntry={false}
	/>
);

export default CloseLivechatSheet;
