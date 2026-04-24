declare module "*.svg" {
  import { ImageProps } from "next/image";
  const src: string;
  const content: string;
  const width: number;
  const height: number;
  const blurDataURL: string;
  const blurHash: string;
  export default src;
  export { content, width, height, blurDataURL, blurHash };
}

declare module "*.svg" {
  const content: string;
  export default content;
}