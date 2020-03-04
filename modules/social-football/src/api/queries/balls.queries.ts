import gql from 'graphql-tag';

export const BALLS = gql`
    query GetBallsForThread($threadId: String!) {
        getBallsForThread(threadId: $threadId){
            threadId,
            ballByUser,
            total
        }
    }
`