import FloatingActionButton from '~/containers/FloatingActionButton';
import i18n from '~/i18n';

const NewMessageButton = ({ onPress }: { onPress: () => void }) => (
	<FloatingActionButton
		icon='add'
		accessibilityLabel={i18n.t('Create_new_channel_team_dm_discussion')}
		testID='rooms-list-view-create-channel'
		onPress={onPress}
	/>
);

export default NewMessageButton;
