import cloudinary from "../config/cloudinary.config";

export const uploadImage = (
    buffer: Buffer,
    folder = "uploads"
): Promise<string> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                { folder },
                (error, result) => {
                    if (error) return reject(error);

                    if(!result || !result.secure_url) {
                        return reject(new Error("Failed to upload image to Cloudinary"));
                    }

                    resolve(result.secure_url);
                }
            )
            .end(buffer);
    });
};