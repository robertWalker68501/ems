import { ImageKit } from '@imagekit/nodejs';
import fs from 'fs';

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Upload image
export const uploadToImageKit = async (fileInput, fileName) => {
  try {
    let fileToUpload;

    if (Buffer.isBuffer(fileInput)) {
      fileToUpload = fileInput.toString('base64');
    } else {
      fileToUpload = fs.createReadStream(fileInput);
    }

    const result = await imageKit.files.upload({
      file: fileToUpload,
      fileName: fileName,
      folder: '/employee_profiles',
    });

    return result;
  } catch (error) {
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

// Delete an image from ImageKit
export const deleteFromImageKit = async (url) => {
  try {
    if (!url || typeof url !== 'string' || !url.includes('ik.imagekit.io')) {
      return null;
    }

    const fileName = url.substring(url.lastIndexOf('/') + 1);

    if (!fileName) return null;

    const files = await imageKit.assets.list({
      searchQuery: `name = "${fileName}"`,
    });

    if (files && files.length > 0) {
      const fileId = files[0].fileId;
      const deleteResult = await imageKit.files.delete(fileId);
      return deleteResult;
    }

    return null;
  } catch (error) {
    throw new Error(`ImageKit deletion failed:, ${error.message}`);
  }
};

export default imageKit;
