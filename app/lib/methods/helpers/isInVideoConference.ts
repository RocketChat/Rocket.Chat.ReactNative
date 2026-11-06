type TVideoConferenceMember = { joined?: boolean; leftAt?: Date | string };

export const isInVideoConference = (user: TVideoConferenceMember): boolean => user.joined !== false && !user.leftAt;
