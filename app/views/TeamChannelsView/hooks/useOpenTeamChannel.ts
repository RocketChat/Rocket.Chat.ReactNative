import I18n from '~/i18n';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { getRoomTitle, useDebounce } from '~/lib/methods/helpers';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { showErrorAlert, showErrorAlertWithEMessage } from '~/lib/methods/helpers/info';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { getRoomInfo } from '~/lib/services/restApi';
import { type TTeamChannel } from '../types';

export const useOpenTeamChannel = () => {
	const isMasterDetail = useMasterDetail();

	return useDebounce(
		async (item: TTeamChannel) => {
			logEvent(events.TC_GO_ROOM);
			try {
				let params = {};
				const result = await getRoomInfo(item._id);
				if (result.success) {
					params = {
						rid: item._id,
						name: getRoomTitle(result.room),
						joinCodeRequired: result.room.joinCodeRequired,
						t: result.room.t,
						teamId: result.room.teamId
					};
				}
				goRoom({ item: params, isMasterDetail });
			} catch (e: any) {
				if (e?.data?.error === 'not-allowed') {
					showErrorAlert(I18n.t('error-not-allowed'));
					return;
				}
				showErrorAlertWithEMessage(e);
			}
		},
		1000,
		{ leading: true, trailing: false }
	);
};
