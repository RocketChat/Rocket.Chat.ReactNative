import { type ReactElement } from 'react';

import I18n from '~/i18n';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import ConferenceMessage, { type IConferenceMessageAction } from './ConferenceMessage';

interface IConferenceEndedMessage {
	onRejoin?: () => void;
}

const ConferenceEndedMessage = ({ onRejoin }: IConferenceEndedMessage): ReactElement => {
	const close: IConferenceMessageAction = {
		title: I18n.t('Close'),
		type: onRejoin ? 'secondary' : 'primary',
		onPress: closeConferenceCall,
		testID: 'conference-ended-close'
	};

	return (
		<ConferenceMessage
			icon='phone-off'
			title={I18n.t('Call_ended')}
			actions={onRejoin ? [{ title: I18n.t('Join_call'), onPress: onRejoin, testID: 'conference-ended-rejoin' }, close] : [close]}
		/>
	);
};

export default ConferenceEndedMessage;
