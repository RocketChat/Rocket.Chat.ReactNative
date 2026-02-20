import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';

export const messageBlockWithContext = (context: any) =>
	function MessageBlockWithContext(props: any) {
		return (
			<KitContext.Provider value={context}>
				<MessageBlock {...props} />
			</KitContext.Provider>
		);
	};

const MessageBlock = ({ blocks }: any) => UiKitMessage(blocks);

export const ModalBlockWithContext = (props: any) => (
	<KitContext.Provider value={props}>
		<ModalBlock {...props} />
	</KitContext.Provider>
);

const ModalBlock = ({ blocks }: any) => UiKitModal(blocks);
