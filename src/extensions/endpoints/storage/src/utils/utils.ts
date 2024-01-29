import fs from 'fs';
import { FilesService } from '@directus/api/dist/services/files';

export const writeToFile = (filename: string, data: Buffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.appendFile(filename, data, async (e: NodeJS.ErrnoException | null) => {
      if (e) {
        await deleteFile(filename).catch(() => undefined);
        reject(console.error(`Could not write to file [${filename}], error: ${e.message}`));
      }
      resolve();
    });
  });
};

export const openFile = (filename: string) => {
  const file = fs.createReadStream(filename);
  file.on('end', () => {
    deleteFile(filename)
      .catch(e => console.error(`Could not delete file [${filename}] after stream ended error: ${e.message}`));
  });
  return file;
};

export const UploadFileToS3 = async (
  FilesService: FilesService,
  filename: string,
): Promise<string> => {

  const fileGuid = await FilesService.uploadOne(openFile(filename), {
    storage: process.env.STORAGE_LOCATIONS!,
    type: 'application/octet-stream',
    filename_download: filename,
    title: filename,
  });

  return fileGuid.toString();
};

const deleteFile = (filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const callback = (e: NodeJS.ErrnoException | null) => (e ? reject(e) : resolve());
    fs.unlink(filename, callback);
  });
};
