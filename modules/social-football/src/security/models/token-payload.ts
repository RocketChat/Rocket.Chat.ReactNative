/**
 * Defining the information stored in a Token Payload.
 */

export interface TokenPayload {
    username: string;
    userId: string;
    rocketChatAccessToken: string;
    rocketChatUserId: string;
    roles: string[];
}
