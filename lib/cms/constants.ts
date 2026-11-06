/** Every cached read of CMS content carries this tag, and every save clears it. */
export const CMS_CACHE_TAG = "cms";

export const IMAGE_BUCKET = "cms-images";
export const VIDEO_BUCKET = "cms-videos";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

export const MEDIA_FOLDERS = [
  { value: "profile", label: "Profile photos" },
  { value: "logo", label: "Logos" },
  { value: "projects", label: "Projects" },
  { value: "services", label: "Services" },
  { value: "sections", label: "Page sections" },
  { value: "video", label: "Videos" },
  { value: "other", label: "Other" },
] as const;
