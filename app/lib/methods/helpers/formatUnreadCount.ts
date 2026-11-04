export const formatUnreadCount = (count: number, max = 99) => (count > max ? `+${max}` : String(count));
