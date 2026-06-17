import { Router } from "express";
import { upload } from "../../middleware/upload.middleware";
import { ApiError } from "../../error/api.error";
import { uploadImage } from "../../lib/cloudinary";


const route = Router()

route.post('/',upload.single("image"), async (req, res, next) => {
     try {
        console.log(req.file);
            if (!req.file) {
                throw ApiError.BadRequest(
                    "Image is required"
                );
            }

            const imageUrl = await uploadImage(
                req.file.buffer,
                "avatars"
            );

            return res.status(200).json({
                success: true,
                imageUrl,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
})

export default route