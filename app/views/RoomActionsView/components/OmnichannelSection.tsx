import React from 'react';
import  * as List  from '../../../containers/List';
import { IRoom } from '../../../definitions';

type OmnichannelSectionProps = {
  room: IRoom;
  omnichannelPermissions: {
    canForwardGuest: boolean;
    canPlaceLivechatOnHold: boolean;
  };
};

const OmnichannelSection: React.FC<OmnichannelSectionProps> = ({ room, omnichannelPermissions }) => {
  if (room.t !== 'l') {
    return null;
  }

  return (
    <List.Section>
      {omnichannelPermissions?.canForwardGuest && (
        <>
          <List.Item
            title='Forward Guest'
            onPress={() => console.log('Forward Guest')}
            left={() => <List.Icon name='chat-forward' />}
            showActionIndicator
          />
          <List.Separator />
        </>
      )}
      {omnichannelPermissions?.canPlaceLivechatOnHold && (
        <>
          <List.Item
            title='Place on Hold'
            onPress={() => console.log('Place on Hold')}
            left={() => <List.Icon name='pause' />}
            showActionIndicator
          />
          <List.Separator />
        </>
      )}
    </List.Section>
  );
};

export default OmnichannelSection;