import gql from 'graphql-tag';
import { OVERVIEW } from "../fragments/threads.fragments";

export const CREATE_BALL = gql `
    mutation CreateBall($threadId: String!) {
        createBall(threadId:$threadId){
            ...ThreadsOverview
        }
    }
    ${OVERVIEW}
`;