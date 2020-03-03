import React from 'react';
import { HeaderButton } from './HeaderButton';

/**
 * Defining a Save Thread Button within the Header.
 */

export const HeaderSaveThreadButton = ({ onPress }) => (
    <HeaderButton onPress={onPress} orientation="right" image={require('../../assets/images/save-post.png')} />
);
