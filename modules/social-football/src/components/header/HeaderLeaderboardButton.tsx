import React from 'react';
import { HeaderButton } from './HeaderButton';

/**
 * Defining a Leaderboard Button within the Header.
 */

export const HeaderLeaderboardButton = ({ navigation }) => (
    <HeaderButton orientation={'left'} onPress={() => null} image={require('../../assets/images/trophy.png')} />
);
