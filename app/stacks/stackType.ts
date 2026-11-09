import { type Table } from '@rocket.chat/message-parser';

import { type IAttachment } from '../definitions';
import { type IMarkdownContext } from '../containers/markdown/contexts/MarkdownContext';
import { type IOptionsField } from '../views/NotificationPreferencesView/options';

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
	TableView: {
		value: Table['value'];
	} & Pick<IMarkdownContext, 'mentions' | 'channels' | 'username' | 'useRealName'>;
};
