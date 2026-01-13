// Ex: '[ ](https://open.rocket.chat/group/test?msg=abcdef)  Test'
// Return: 'Test'
export const formatHyperlink = (text: string): string => text.replace(/^\[([\s]*)\]\(([^)]*)\)\s/, '').trim();
