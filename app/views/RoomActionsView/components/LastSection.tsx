import React from 'react';
import  * as List  from '../../../containers/List';
import { IRoom } from '../../../definitions';

type LastSectionProps = {
  room: IRoom;
  joined: boolean;
  loading: boolean;
  theme: string;
};

const LastSection: React.FC<LastSectionProps> = ({ room, joined, loading, theme }) => {
  if (!joined || room.t === 'l') {
    return null;
  }

  return (
    <List.Section>
      <List.Separator />
      <List.Item
        title='Leave Room'
        onPress={() => console.log('Leave Room')}
        testID='last-section-leave-room'
        left={() => <List.Icon name='logout' color='red' />} // Adjust color dynamically
        showActionIndicator
      />
      <List.Separator />
    </List.Section>
  );
};

export default LastSection;