const regex = new RegExp(/\.[^/.]+$/); // Check from last '.' of the string

export const replaceImageFilename = (filename: string): string => filename.replace(regex, '.jpg'); // Replace files that ends with .jpg | .heic | .jpeg to .jpg
