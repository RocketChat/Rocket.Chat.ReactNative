import { closeLivechat as closeLivechatService } from '../../../../lib/methods/helpers/closeLivechat';
import { showErrorAlert } from '../../../../lib/methods/helpers/info';
import log from '../../../../lib/methods/helpers/log';
import { getDepartmentInfo, getTagsList } from '../../../../lib/services/restApi';
import { navigateToScreen, type TRoomStackNavigation } from '../navigateToScreen';
import { closeLivechat } from '../closeLivechat';

jest.mock('../../../../lib/methods/helpers/closeLivechat', () => ({ closeLivechat: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../../lib/services/restApi', () => ({
	getDepartmentInfo: jest.fn(),
	getTagsList: jest.fn()
}));
jest.mock('../navigateToScreen', () => ({ navigateToScreen: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockCloseLivechatService = closeLivechatService as jest.Mock;
const mockGetDepartmentInfo = getDepartmentInfo as jest.Mock;
const mockGetTagsList = getTagsList as jest.Mock;
const mockNavigateToScreen = navigateToScreen as jest.Mock;

const navigation = { navigate: jest.fn() } as unknown as TRoomStackNavigation;

describe('closeLivechat', () => {
	beforeEach(() => jest.clearAllMocks());

	it('closes the chat with the default comment when neither a comment nor tags are required', async () => {
		await closeLivechat({ rid: 'rid-1', isMasterDetail: false, livechatRequestComment: false, navigation });

		expect(mockCloseLivechatService).toHaveBeenCalledWith({
			rid: 'rid-1',
			isMasterDetail: false,
			comment: 'Chat closed by agent'
		});
		expect(mockNavigateToScreen).not.toHaveBeenCalled();
	});

	it('navigates to the close view when a comment is required', async () => {
		await closeLivechat({ rid: 'rid-1', isMasterDetail: true, livechatRequestComment: true, navigation });

		expect(mockCloseLivechatService).not.toHaveBeenCalled();
		expect(mockNavigateToScreen).toHaveBeenCalledWith({
			navigation,
			isMasterDetail: true,
			screen: 'CloseLivechatView',
			params: { rid: 'rid-1', departmentId: undefined, departmentInfo: undefined, tagsList: undefined }
		});
	});

	it('fetches the tags list and navigates when the department requires tags', async () => {
		const department = { _id: 'dep-1', requestTagBeforeClosingChat: true };
		mockGetDepartmentInfo.mockResolvedValueOnce({ success: true, department });
		mockGetTagsList.mockResolvedValueOnce([{ _id: 'tag-1' }]);

		await closeLivechat({
			rid: 'rid-1',
			departmentId: 'dep-1',
			isMasterDetail: false,
			livechatRequestComment: false,
			navigation
		});

		expect(mockGetDepartmentInfo).toHaveBeenCalledWith('dep-1');
		expect(mockGetTagsList).toHaveBeenCalledTimes(1);
		expect(mockCloseLivechatService).not.toHaveBeenCalled();
		expect(mockNavigateToScreen).toHaveBeenCalledWith({
			navigation,
			isMasterDetail: false,
			screen: 'CloseLivechatView',
			params: { rid: 'rid-1', departmentId: 'dep-1', departmentInfo: department, tagsList: [{ _id: 'tag-1' }] }
		});
	});

	it('ignores a failed department lookup and closes with the default comment', async () => {
		mockGetDepartmentInfo.mockResolvedValueOnce({ success: false });

		await closeLivechat({
			rid: 'rid-1',
			departmentId: 'dep-1',
			isMasterDetail: false,
			livechatRequestComment: false,
			navigation
		});

		expect(mockCloseLivechatService).toHaveBeenCalledTimes(1);
		expect(mockNavigateToScreen).not.toHaveBeenCalled();
	});

	it.each(['department', 'tags'])('reports failed %s requests without closing or navigating', async request => {
		const error = new Error('offline');
		if (request === 'department') {
			mockGetDepartmentInfo.mockRejectedValueOnce(error);
		} else {
			mockGetDepartmentInfo.mockResolvedValueOnce({ success: true, department: { requestTagBeforeClosingChat: true } });
			mockGetTagsList.mockRejectedValueOnce(error);
		}

		await expect(
			closeLivechat({ rid: 'rid-1', departmentId: 'dep-1', isMasterDetail: false, livechatRequestComment: false, navigation })
		).resolves.toBeUndefined();

		expect(showErrorAlert).toHaveBeenCalledWith('offline', 'Oops!');
		expect(log).toHaveBeenCalledWith(error);
		expect(mockCloseLivechatService).not.toHaveBeenCalled();
		expect(mockNavigateToScreen).not.toHaveBeenCalled();
	});

	it.each([
		[{ error: 'error-not-allowed', reason: 'server reason' }, 'Not allowed'],
		[{ error: 'untranslated-error', reason: 'server reason' }, 'server reason']
	])('reports REST errors using translated codes or the server reason', async (error, message) => {
		mockGetDepartmentInfo.mockRejectedValueOnce(error);

		await closeLivechat({
			rid: 'rid-1',
			departmentId: 'dep-1',
			isMasterDetail: false,
			livechatRequestComment: false,
			navigation
		});

		expect(showErrorAlert).toHaveBeenCalledWith(message, 'Oops!');
		expect(log).toHaveBeenCalledWith(error);
		expect(mockCloseLivechatService).not.toHaveBeenCalled();
		expect(mockNavigateToScreen).not.toHaveBeenCalled();
	});
});
