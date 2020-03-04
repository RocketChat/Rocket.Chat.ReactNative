import gql from 'graphql-tag';

export const CREATE_BALL = gql `
    mutation CreateBall($threadId: String!) {
        createBall(threadId:$threadId)
    }
`;