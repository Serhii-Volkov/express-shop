import { ApiError } from '@src/error/api.error'
import { prisma } from '@src/lib/prisma'
import {Request, Response} from 'express'
import { uploadImage } from '@src/lib/cloudinary'
import File from 'multer'

export const getAllCategories = async(req: Request, res: Response) => { 
    try{
        const categories = await prisma.category.findMany()
         
        return res.status(200).json({data:{categories}})
    } catch (e) {
        throw ApiError.Internal('Server error')
    }
}

export const getCategoryById = async(req: Request<{ id: string }>, res: Response) => {
    try{
        const {id} = req.params

        if(!id) {
            throw ApiError.BadRequest('Id is required')
        }
        const categories = await prisma.category.findUnique({where: {id}})

        if(!categories) {
            throw ApiError.NotFound('Категория не найдена')
        }
        return res.status(200).json({data:{categories}})

    } catch (e) {
        throw ApiError.Internal('Server error')
    }

}

export const createCategory = async(req: Request, res: Response) => {
    try{
        const {name, slug, description} = req.body
        const imageUrl = req.file?.buffer
        if(!imageUrl) {
            throw ApiError.BadRequest('Image is required')
        }

        const image = await uploadImage(imageUrl, 'categories')


        const categories= await prisma.category.create({data: {
            name, slug, description, imageUrl: image
        }})

        return res.status(201).json({data:{categories}})

    } catch (e) {
        throw ApiError.Internal('Server error')
    }
}
type MulterRequest = Request & {
  file?: File;
};
export const updateCategory = async(req: MulterRequest, res: Response) => {
    try{
        interface Data  {
            name?: string,
            slug?: string, 
            description?: string,
            imageUrl?: string

        }
        const {id} = req.params

        if(typeof id !== 'string') {
            throw ApiError.BadRequest('Id is required')
        }
        const {name, slug, description} = req.body
        const imageUrl = req.file?.buffer

        const data: Data = {}
        
        if(name !== undefined) {
            data.name = name
        }

        if(slug !== undefined) {
            data.slug = slug
        }

        if(description !== undefined) {
            data.description = description
        }

        if(imageUrl !== undefined) {
            const image = await uploadImage(imageUrl, 'categories')
            data.imageUrl = image
        }

     
        
        
        const categories = await prisma.category.update({where: {id}, data: data})
    } catch (e) {
        throw ApiError.Internal('Server error')
    }
}