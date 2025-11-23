import React from 'react';
import  * as List  from '../../../containers/List';
import { E2E_ROOM_TYPES } from '../../../lib/constants/keys';
import { IRoom } from '../../../definitions';

type E2EEncryptionSectionProps = {
  room: IRoom;
  canToggleEncryption: boolean;
  canEdit: boolean;
};

const E2EEncryptionSection: React.FC<E2EEncryptionSectionProps> = ({ room, canToggleEncryption, canEdit }) => {
  const hasPermission = canToggleEncryption || canEdit;

  if (!E2E_ROOM_TYPES[room.t]) {
    return null;
  }

  return (
    <List.Section>
      <List.Separator />
      <List.Item
        title='E2E Encryption'
        subtitle={room.encrypted ? 'Enabled' : 'Disabled'}
        left={() => <List.Icon name='encrypted' />}
        onPress={() => console.log('Navigate to E2E Encryption settings')}
        disabled={!hasPermission}
        showActionIndicator
      />
      <List.Separator />
    </List.Section>
  );
};

export default E2EEncryptionSection;