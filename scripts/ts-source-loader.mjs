import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function fileExists(fileUrl) {
  try {
    await access(fileURLToPath(fileUrl));
    return true;
  } catch {
    return false;
  }
}

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }

    const isRelativeJsSpecifier = (specifier.startsWith('./') || specifier.startsWith('../'))
      && specifier.endsWith('.js');
    const parentUrl = context.parentURL;
    if (!isRelativeJsSpecifier || !parentUrl) {
      throw error;
    }

    const parentPath = fileURLToPath(parentUrl);
    const tsPath = path.resolve(path.dirname(parentPath), specifier.replace(/\.js$/, '.ts'));
    const tsUrl = pathToFileURL(tsPath);
    if (!(await fileExists(tsUrl))) {
      throw error;
    }

    return defaultResolve(tsUrl.href, context, defaultResolve);
  }
}
