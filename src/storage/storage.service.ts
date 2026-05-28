import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto'; //id unico para nombre de archivo
import * as path from 'path'; //auxiliar para extraer el 'webp' o 'jpeg' del nombre del archivo

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; 
const MAX_FILE_SIZE = 5 * 1024 * 1024; //5mb en bytes

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  //conexion a cloudfare utilizando las variables env
  constructor(private config: ConfigService) {
    const accountId = this.config.getOrThrow<string>('CLOUDFLARE_ACCOUNT_ID');
    this.bucket = this.config.getOrThrow<string>('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicUrl = this.config.getOrThrow<string>('CLOUDFLARE_R2_PUBLIC_URL');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('CLOUDFLARE_R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
      },
    });
  }
  

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes (jpeg, png, webp, gif).');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('La imagen no puede superar los 5 MB.');
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const key = `images/${crypto.randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000',
      }),
    );

    return `${this.publicUrl}/${key}`;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const prefix = `${this.publicUrl}/`;
    if (!imageUrl.startsWith(prefix)) return;

    const key = imageUrl.slice(prefix.length);

    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
