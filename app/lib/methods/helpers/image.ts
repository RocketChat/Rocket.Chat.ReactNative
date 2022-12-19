const regExpUrlImage = new RegExp(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/);
export const isImage = (url: string) => regExpUrlImage.test(url);
