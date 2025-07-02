import I18n from '../../../i18n';
import { sendLoadingEvent } from '../../../containers/Loading';
import { getRoomTitle, showErrorAlert } from '../../../lib/methods/helpers';
import { goRoom } from '../../../lib/methods/helpers/goRoom';
import { IError, IResult } from '../interfaces';

interface IHandleLoadingChange {
	loading: boolean;
	failure: boolean;
	isMasterDetail: boolean;
	error: IError;
	result: IResult;
}
const handleSubmitEvent = ({ loading, failure, isMasterDetail, error, result }: IHandleLoadingChange) => {
	sendLoadingEvent({ visible: loading });
	if (!loading) {
		if (failure) {
			const msg = error.reason || I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_discussion') });
			showErrorAlert(msg);
		} else {
			const { rid, t, prid } = result;
			const item = {
				rid,
				name: getRoomTitle(result),
				t,
				prid
			};
			goRoom({ item, isMasterDetail, popToRoot: true });
		}
	}
};

export default handleSubmitEvent;
