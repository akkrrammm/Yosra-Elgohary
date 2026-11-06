/** The public address of a stored file. Each path segment is encoded, the slashes are kept. */
export function publicMediaUrl(baseUrl: string, bucket: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}
