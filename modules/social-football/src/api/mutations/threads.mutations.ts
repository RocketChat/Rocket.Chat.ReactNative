import gql from 'graphql-tag';
import {OVERVIEW} from "../fragments/threads.fragments";

/**
 * Create a new Thread.
 *
 * @param ThreadInput
 * @returns {createThread<thread>}
 */
export const CREATE_THREAD = gql`
    mutation CreateThread($thread: ThreadInput!) {
        createThread(thread:$thread)
    }
`;

export const PUBLISH_THREAD = gql`
    mutation PublishThread($id:String!){
        publishThread(id: $id) {
            ...ThreadsOverview
        }
    }

    ${OVERVIEW}
`;

export const CREATE_BALL = gql `
    mutation CreateBall($threadId: String!) {
        createBall(threadId: $threadId){
            ...ThreadsOverview
        }
    }

    ${OVERVIEW}
`;
