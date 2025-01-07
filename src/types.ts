export interface CompressionOptions {
  png?: {
    compressionLevel?: number;
    palette?: boolean;
  };
  jpeg?: {
    mozjpeg?: boolean;
    trellisQuantisation?: boolean;
    overshootDeringing?: boolean;
    optimizeScans?: boolean;
  };
  webp?: {
    effort?: number;
  };
  avif?: {
    effort?: number;
    lossless?: boolean;
  };
  heif?: {
    effort?: number;
    lossless?: boolean;
  };
  html?: {
    collapseWhitespace?: boolean;
    removeComments?: boolean;
    minifyCSS?: boolean;
    minifyJS?: boolean;
  };
  js?: {
    compress?: boolean;
    mangle?: boolean;
  };
  svg?: {
    multipass?: boolean;
  };
} 