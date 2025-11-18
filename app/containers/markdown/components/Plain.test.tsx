import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext } from '../../../theme';
import { colors as themeColors } from '../../../lib/constants/colors';
import MarkdownContext from '../contexts/MarkdownContext';
import Plain from './Plain';

describe('Plain (highlights)', () => {
  const colors = themeColors.light;

  const getBackground = (node: any) => {
    const { style } = node.props;
    return Array.isArray(style) ? style.find((s: any) => s && s.backgroundColor)?.backgroundColor : style?.backgroundColor;
  };

  it('renders highlighted words with theme highlight background', () => {
    const tree = render(
      <ThemeContext.Provider value={{ theme: 'light', colors }}>
        <MarkdownContext.Provider value={{ highlights: ['rocket'] }}>
          <Plain value={'hello rocket world'} />
        </MarkdownContext.Provider>
      </ThemeContext.Provider>
    );

    const highlighted = tree.getByText('rocket');
    expect(highlighted).toBeTruthy();
    expect(getBackground(highlighted)).toBe(colors.statusBackgroundDanger);
  });

  it('is case-insensitive when matching highlight words', () => {
    const tree = render(
      <ThemeContext.Provider value={{ theme: 'light', colors }}>
        <MarkdownContext.Provider value={{ highlights: ['Rocket'] }}>
          <Plain value={'hello rocket world'} />
        </MarkdownContext.Provider>
      </ThemeContext.Provider>
    );

    const highlighted = tree.getByText('rocket');
    expect(highlighted).toBeTruthy();
    expect(getBackground(highlighted)).toBe(colors.statusBackgroundDanger);
  });

  it('handles punctuation after words', () => {
    const tree = render(
      <ThemeContext.Provider value={{ theme: 'light', colors }}>
        <MarkdownContext.Provider value={{ highlights: ['rocket'] }}>
          <Plain value={'hello rocket, world!'} />
        </MarkdownContext.Provider>
      </ThemeContext.Provider>
    );

    const highlighted = tree.getByText('rocket');
    expect(highlighted).toBeTruthy();
    expect(getBackground(highlighted)).toBe(colors.statusBackgroundDanger);
  });

  it('renders multiple highlights', () => {
    const tree = render(
      <ThemeContext.Provider value={{ theme: 'light', colors }}>
        <MarkdownContext.Provider value={{ highlights: ['rocket', 'world'] }}>
          <Plain value={'hello rocket world'} />
        </MarkdownContext.Provider>
      </ThemeContext.Provider>
    );

    const h1 = tree.getByText('rocket');
    const h2 = tree.getByText('world');
    expect(h1).toBeTruthy();
    expect(h2).toBeTruthy();
    expect(getBackground(h1)).toBe(colors.statusBackgroundDanger);
    expect(getBackground(h2)).toBe(colors.statusBackgroundDanger);
  });

  it('when no highlights configured returns full text and does not create separate highlighted nodes', () => {
    const tree = render(
      <ThemeContext.Provider value={{ theme: 'light', colors }}>
        <MarkdownContext.Provider value={{ highlights: [] }}>
          <Plain value={'hello rocket world'} />
        </MarkdownContext.Provider>
      </ThemeContext.Provider>
    );

    const full = tree.getByText('hello rocket world');
    expect(full).toBeTruthy();
    // there should be no separate node with text 'rocket'
    const rocket = tree.queryByText('rocket');
    expect(rocket).toBeNull();
  });
});
