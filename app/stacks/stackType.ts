import { type IAttachment } from '../definitions/IAttachment';
import { type IOptionsField } from '../views/NotificationPreferencesView/options';
import { type TMediaSharedTransition } from '~/lib/animations/mediaSharedTransition';

export type TNavigation = {
	PickerView: {
		title: string;
		data: IOptionsField[];
		value?: string;
		onSearch: (text?: string, offset?: number) => Promise<any>;
		onEndReached?: (text?: string, offset?: number) => Promise<any>;
		total?: number;
		onChangeValue: Function;
	};
	ForwardLivechatView: {
		rid: string;
	};
	AttachmentView: {
		attachment: IAttachment;
		sharedTransition?: TMediaSharedTransition;
	};
};
