export const insertTimestampAtCursor = (
    text: string, 
    timestamp: string, 
    cursor: number
) => {
    const beforeCursor = text.slice(0, cursor);
    const afterCursor = text.slice(cursor);
    const needSpaceBefore = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
    const needSpaceAfter = afterCursor.length > 0 && !afterCursor.startsWith(' ');

    const prefix = needSpaceBefore ? ' ' : '';
    const suffix = needSpaceAfter ? ' ' : '';
    const insertText = `${prefix}${timestamp}${suffix}`;

    const updatedText = beforeCursor + insertText + afterCursor;
    const updatedCursor = cursor + insertText.length;

    return {
        updatedText,
        updatedCursor
    };
};