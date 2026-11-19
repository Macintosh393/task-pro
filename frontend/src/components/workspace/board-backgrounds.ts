import type { BoardBackground } from '../ui';

export type BoardBackgroundImage = { mobile: string; tablet: string; desktop: string };
type Viewport = keyof BoardBackgroundImage;

const files = import.meta.glob<string>('../../assets/board-backgrounds/bg-*-*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const images = new Map<string, Partial<BoardBackgroundImage>>();
for (const [path, url] of Object.entries(files)) {
  const match = /(bg-\d{2})-(mobile|tablet|desktop)\.jpg$/.exec(path);
  if (!match) continue;
  const [, id, viewport] = match;
  images.set(id, { ...images.get(id), [viewport as Viewport]: url });
}

/** Full-size images for a board background, or `null` for `none` / unknown ids. */
export function getBoardBackgroundImage(background: BoardBackground): BoardBackgroundImage | null {
  const image = images.get(background);
  return image?.mobile && image.tablet && image.desktop ? (image as BoardBackgroundImage) : null;
}
