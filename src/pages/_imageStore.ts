import path from 'node:path';

const blogRaw = import.meta.glob<{ default: any }>('../content/blog/**/*.{png,jpg,jpeg,gif,webp,svg}', {
  eager: true,
  query: '?url',
});

const imageMap: Record<string, string> = {};

function buildMap(glob: typeof blogRaw) {
  for (const [key, mod] of Object.entries(glob)) {
    const val: any = mod;
    const inner = val?.default || val;
    const url = typeof inner === 'string' ? inner : (inner?.src || '');
    if (url) {
      const cleanKey = key.replace(/^\.\.\/content\//, '');
      imageMap[cleanKey] = url;
    }
  }
}

buildMap(blogRaw);

export function resolveCover(collection: string, entryId: string, cover?: string): string | undefined {
  if (!cover) return undefined;
  if (!cover.startsWith('./') && !cover.startsWith('../')) return cover;

  // Entry ids from the glob loader can be either the directory (for
  // `<dir>/index.md`, e.g. "welcome") or include a filename (for
  // `<dir>/<name>.md`, e.g. "foo/bar"). Try both interpretations so the
  // cover resolves regardless of layout.
  const idParts = entryId.split('/');
  const candidateDirs = [
    idParts.join('/'),        // entryId is itself the directory (index.md case)
    idParts.slice(0, -1).join('/'), // entryId includes a filename
  ];

  for (const dir of candidateDirs) {
    const contentDir = dir ? `${collection}/${dir}/` : `${collection}/`;
    const lookupKey = path.normalize(`${contentDir}${cover}`);
    if (imageMap[lookupKey]) return imageMap[lookupKey];
  }

  return cover;
}
