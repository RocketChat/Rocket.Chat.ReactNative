import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { UiKitMessage as renderUiKitMessage, UiKitModal as renderUiKitModal } from './index';
import { KitContext } from './utils';

const styles = StyleSheet.create({
	block: {
		marginBottom: 16
	},
	lastBlock: {
		marginBottom: 4
	}
});

// Mirrors the web client: Fuselage wraps each surface in `<Margins blockEnd>`
// so every block carries a bottom margin except the last one. Blocks
// themselves stay margin-free. The last block keeps a small margin so content
// below doesn't sit flush against it.
const keyByPosition = (renderedBlocks: ReactElement[]) =>
	renderedBlocks.map((renderedBlock, position) => (
		<View key={position} style={position < renderedBlocks.length - 1 ? styles.block : styles.lastBlock}>
			{renderedBlock}
		</View>
	));

const MessageBlockContent = ({ blocks }: any) => {
	const rendered = keyByPosition(renderUiKitMessage(blocks));
	return <>{rendered}</>;
};

export const MessageBlock = ({ blocks, context }: any) => (
	<KitContext.Provider value={context}>
		<MessageBlockContent blocks={blocks} />
	</KitContext.Provider>
);

export const ModalBlockWithContext = (props: any) => (
	<KitContext.Provider value={props}>
		<ModalBlock blocks={props.blocks} />
	</KitContext.Provider>
);

const ModalBlock = ({ blocks }: any) => {
	const rendered = keyByPosition(renderUiKitModal(blocks));
	return <>{rendered}</>;
};
