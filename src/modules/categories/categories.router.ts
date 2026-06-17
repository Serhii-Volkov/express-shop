import Router from "express";
import { createCategory, getAllCategories, getCategoryById } from "./categories.controller";
import { upload } from "@src/middleware/upload.middleware";
import File from 'multer'

const route = Router()



route.get('/all', getAllCategories)
route.get('/:id', getCategoryById)
route.post('/',upload.single("imageUrl"), createCategory)

export default route