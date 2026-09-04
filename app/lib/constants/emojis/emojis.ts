import { emojisByCategory } from './data';

// Flat list of every emoji the picker lists, in category order.
export const emojis = Object.values(emojisByCategory).flat();

export const DEFAULT_EMOJIS = ['clap', 'thumbsup', 'heart_eyes', 'grinning', 'thinking', 'smiley'];
