import { Accountability } from '@directus/types';
import { Request, Router } from 'express';
import { FilesService } from '@directus/api/dist/services/files';
import { EndpointConfig, EndpointExtensionContext } from '@directus/extensions';
import { UploadFileToS3, writeToFile } from './utils/utils';
import bodyParser from 'body-parser';

type ExtendedRequest = Request & {
  accountability: Accountability;
};

interface IUploadQueryData {
  chunkNumber: string;
  totalChunks: string;
  filename: string;
}

const storageEndpoint: EndpointConfig = {
  id: 'storage',
  handler: (router: Router, ctx: EndpointExtensionContext) => {
    router.use(bodyParser.raw({ type: 'application/octet-stream', limit: '200mb' }));

    router.get('/', (_req, res) => {
      res.send('working');
    });

    // all this endpoint does is upload a file using FilesService
    // file is uploaded only when last chunk is received if not last chunk than just temporarly save file.
    router.post('/upload', async (req, res) => {
      try {
        const request = req as ExtendedRequest;
        const { accountability } = request;

        const { chunkNumber, totalChunks, filename } = req.query as unknown as IUploadQueryData;

        const lastChunk = chunkNumber === totalChunks;

        const schema = await ctx.getSchema();
        const FilesService: FilesService = new ctx.services.FilesService({ accountability, schema });

        await writeToFile(filename, req.body);

        if (lastChunk) {
          const fileGuid = await UploadFileToS3(FilesService, filename);
          return res.status(200).send({ fileGuid });
        }

        return res.status(200).send();
      } catch (error) {
        console.error(error);
        return res.status(500).send('Server error, error message:');
      }
    });
  },
};

module.exports = storageEndpoint;
