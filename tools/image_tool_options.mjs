import path from 'node:path';

export function parseImageToolOptions({ allowRetry = false, extraUsage = '' } = {}) {
  const args = process.argv.slice(2);
  const usage = `Usage: node ${path.basename(process.argv[1])} --output-dir <directory> [--image-dir <directory>]${allowRetry ? ' [--retry]' : ''}${extraUsage}`;
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    process.exit(0);
  }
  const valueFor = flag => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const outputValue = valueFor('--output-dir');
  if (!outputValue || outputValue.startsWith('--')) throw new Error(`${usage}\n\n--output-dir is required and must contain matching CHOICE-* and FILL-* files.`);
  const root = process.cwd();
  const imageValue = valueFor('--image-dir') ?? 'images';
  return {
    root,
    outputDir: path.resolve(root, outputValue),
    imageDir: path.resolve(root, imageValue),
    retry: allowRetry && args.includes('--retry'),
    reportPrefix: path.basename(path.resolve(root, outputValue)).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase(),
  };
}
