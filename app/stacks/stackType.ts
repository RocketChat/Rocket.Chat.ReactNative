import { IAttachment } from '../definitions';
import { IOptionsField } from '../views/NotificationPreferencesView/options';

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
	};
};
