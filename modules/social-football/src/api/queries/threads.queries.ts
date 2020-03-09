import gql from "graphql-tag";
import { OVERVIEW } from "../fragments/threads.fragments";

/**
 * Get all information needed to show the Timeline page.
 * 
 * @param Timeline(ContentType, Int, Int)
 * @returns {getThreads<threads>}
 */
export const TIMELINE = gql`
    query Timeline($filterType: ContentType, $offset: Int, $limit: Int) {
        getThreads(filterType: $filterType, offset: $offset, limit: $limit){
            threads {
              ...ThreadsOverview
            }
            total,
            limit,
            offset,
        }
    }

    ${OVERVIEW}
`;

/**
 * Get all information needed to preview a Thread.
 * 
 * @param Preview(ContentType, String)
 * @returns {getPreviewMetadata}
 */
export const PREVIEW_METADATA = gql`
    query Preview($type: ContentType!, $url: String!) {
        getPreviewMetadata(type: $type, url: $url) {
            url,
            title,
            description,
            image,
        }
    }
`;
