declare module "subset-font" {
  type Axis = number | { min: number; max: number; default?: number };
  export default function subsetFont(
    font: Buffer | Uint8Array,
    text: string,
    options?: {
      targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
      preserveNameIds?: number[];
      variationAxes?: Record<string, Axis>;
      noLayoutClosure?: boolean;
    },
  ): Promise<Buffer>;
}
