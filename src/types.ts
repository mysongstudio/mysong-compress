import { Options as HtmlMinifierOptions } from "html-minifier-terser";
import { Config as SvgoConfig } from "svgo";
import { MinifyOptions as CssoMinifyOptions, CompressOptions as CssoCompressOptions } from "csso";
import { AvifOptions, JpegOptions, PngOptions, WebpOptions, HeifOptions } from "sharp";
import { MinifyOptions } from "terser";

export interface CompressionOptions {
  cache?: {
    enabled: boolean;
    cacheDir?: string;
  }
  png?: PngOptions
  jpeg?: JpegOptions;
  webp?: WebpOptions;
  avif?: AvifOptions;
  heif?: HeifOptions;
  html?: HtmlMinifierOptions;
  js?: MinifyOptions;
  svg?: SvgoConfig;
  css?: CssoMinifyOptions | CssoCompressOptions;
}

export interface UsedConfig {
  config: CompressionOptions;
  reason: string;
} 