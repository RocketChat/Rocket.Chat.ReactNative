const UUID_PREFIX_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/;

export const stripUuidPrefix = (filename: string): string => filename.replace(UUID_PREFIX_REGEX, '');
