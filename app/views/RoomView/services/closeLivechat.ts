import { type ILivechatDepartment } from '../../../definitions/ILivechatDepartment';
import { type ILivechatTag } from '../../../definitions/ILivechatTag';
import i18n from '../../../i18n';
import { closeLivechat as closeLivechatService } from '../../../lib/methods/helpers/closeLivechat';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import log from '../../../lib/methods/helpers/log';
import { getDepartmentInfo, getTagsList } from '../../../lib/services/restApi';
import { navigateToScreen, type TRoomStackNavigation } from './navigateToScreen';

export const closeLivechat = async ({
	rid,
	departmentId,
	isMasterDetail,
	livechatRequestComment,
	navigation
}: {
	rid: string;
	departmentId?: string;
	isMasterDetail: boolean;
	livechatRequestComment: boolean;
	navigation: TRoomStackNavigation;
}): Promise<void> => {
	try {
		let departmentInfo: ILivechatDepartment | undefined;
		let tagsList: ILivechatTag[] | undefined;

		if (departmentId) {
			const result = await getDepartmentInfo(departmentId);
			if (result.success) {
				departmentInfo = result.department as ILivechatDepartment;
			}
		}

		if (departmentInfo?.requestTagBeforeClosingChat) {
			tagsList = await getTagsList();
		}

		if (!livechatRequestComment && !departmentInfo?.requestTagBeforeClosingChat) {
			return closeLivechatService({ rid, isMasterDetail, comment: i18n.t('Chat_closed_by_agent') });
		}

		navigateToScreen({
			navigation,
			isMasterDetail,
			screen: 'CloseLivechatView',
			params: { rid, departmentId, departmentInfo, tagsList }
		});
	} catch (e: any) {
		showErrorAlert(i18n.isTranslated(e.error) ? i18n.t(e.error) : e.reason || e.message, i18n.t('Oops'));
		log(e);
	}
};
