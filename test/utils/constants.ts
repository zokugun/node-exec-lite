import fse from '@zokugun/fs-extra-plus';

export const FIXTURES_DIRECTORY = fse.resolve(import.meta.dirname, '..', 'fixtures');
export const IS_MACOS = process.platform === 'darwin';
export const IS_WINDOWS = process.platform === 'win32';
