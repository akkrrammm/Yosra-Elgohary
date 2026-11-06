/** "Main title | Subtitle" becomes two lines on the site. */
export const splitTitle = (title: string) => {
  const [main, sub] = title.split(" | ");
  return { main, sub };
};
