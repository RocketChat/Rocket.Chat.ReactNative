// Match query string from the message to replace it with the suggestion
const getMentionRegexp = (): any => /[^@:#/!]*$/;

export default getMentionRegexp;
