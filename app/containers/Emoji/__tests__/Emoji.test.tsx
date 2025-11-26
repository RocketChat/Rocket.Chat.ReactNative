import React from 'react';
import { render } from '@testing-library/react-native';

import Emoji from '../Emoji';

// Mock dependencies
jest.mock('../../../lib/hooks/useShortnameToUnicode', () => ({
    __esModule: true,
    default: () => ({
        formatShortnameToUnicode: (str: string) => (str === ':smile:' ? '😄' : str)
    })
}));

jest.mock('../../EmojiPicker/CustomEmoji', () => {
    const { View } = require('react-native');
    return (props: any) => <View testID="mock-custom-emoji" {...props} />;
});

jest.mock('../../../theme', () => ({
    useTheme: () => ({ colors: { fontDefault: 'black' } })
}));

jest.mock('../../../lib/hooks/useResponsiveLayout/useResponsiveLayout', () => ({
    useResponsiveLayout: () => ({ fontScaleLimited: 1 })
}));

describe('Emoji', () => {
    it('renders standard emoji correctly', () => {
        const { getByText } = render(<Emoji literal=":smile:" />);
        expect(getByText('😄')).toBeTruthy();
    });

    it('renders custom emoji correctly', () => {
        const customEmoji = { name: 'party_parrot', extension: 'gif' };
        const { getByTestId } = render(<Emoji customEmoji={customEmoji} />);
        expect(getByTestId('mock-custom-emoji')).toBeTruthy();
    });
});
