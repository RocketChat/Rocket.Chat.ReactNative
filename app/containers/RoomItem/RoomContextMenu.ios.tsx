import { Host } from '@expo/ui';
import { Button, ContextMenu, RNHostView, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, lineLimit, padding } from '@expo/ui/swift-ui/modifiers';
import { View } from 'react-native';

import { useTheme } from '~/theme';
import { useRoomContextMenuActions } from './useRoomContextMenuActions';
import { type IRoomContextMenu } from './RoomContextMenu';

const PREVIEW_WIDTH = 300;

const RoomContextMenu = ({ children, enabled, rid, type, name, lastMessage, isRead, favorite, width }: IRoomContextMenu) => {
	const { colors, theme } = useTheme();
	const actions = useRoomContextMenuActions({ rid, type, isRead, favorite });

	if (!enabled) {
		return children;
	}

	return (
		<Host style={{ width }} matchContents={{ vertical: true }} colorScheme={theme === 'light' ? 'light' : 'dark'}>
			<ContextMenu>
				<ContextMenu.Trigger>
					<RNHostView matchContents>
						<View style={{ width }}>{children}</View>
					</RNHostView>
				</ContextMenu.Trigger>
				<ContextMenu.Preview>
					<VStack
						alignment='leading'
						spacing={4}
						modifiers={[frame({ width: PREVIEW_WIDTH, alignment: 'leading' }), padding({ all: 16 })]}>
						<Text modifiers={[font({ textStyle: 'headline' }), foregroundStyle(colors.fontTitlesLabels), lineLimit(1)]}>
							{name}
						</Text>
						{lastMessage ? (
							<Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(colors.fontSecondaryInfo), lineLimit(3)]}>
								{lastMessage}
							</Text>
						) : null}
					</VStack>
				</ContextMenu.Preview>
				<ContextMenu.Items>
					{actions.map(action => (
						<Button key={action.testID} testID={action.testID} label={action.title} onPress={action.onPress} />
					))}
				</ContextMenu.Items>
			</ContextMenu>
		</Host>
	);
};

export default RoomContextMenu;
