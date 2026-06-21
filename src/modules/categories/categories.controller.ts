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
        return res.status(500).json({message: 'Server error'})
    }
}

export const getCategoryById = async(req: Request<{ id: string }>, res: Response) => {
    try{
        const {id} = req.params

        if(!id) {
            return res.status(400).json({message: 'Id is required'})
        }
        const categories = await prisma.category.findUnique({where: {id}})

        if(!categories) {
            return res.status(404).json({message: 'Категория не найдена'})
        }
        return res.status(200).json({data:{categories}})

    } catch (e) {
        return res.status(500).json({message: 'Server error'})
    }

}

export const createCategory = async(req: Request, res: Response) => {
    try{
        const {name, slug, description, parentId} = req.body
        let image = null;

        if (req.file) {
            image = await uploadImage(req.file.buffer, 'categories');
        }

        


        const categories= await prisma.category.create({data: {
            name, slug, description, imageUrl: image, parentId
        }})
        

        return res.status(201).json({data:{categories}})

    } catch (e) {
        return res.status(500).json({message: 'Server error'})
    }
}
type MulterRequest = Request & {
  file?: File;
};

export const updateCategory = async (req: MulterRequest, res: Response) => {
    try {
        const { id } = req.params as {id: string}

        if (!id) {
            return res.status(400).json({ message: 'Id is required' });
        }

        const { name, slug, description, parentId } = req.body;

        const data: any = {};

        if (name) data.name = name;
        if (slug) data.slug = slug;
        if (description) data.description = description;
        if(parentId) data.parentId = parentId

        if (req.file) {
            const imageUrl = await uploadImage(req.file.buffer, 'categories');
            data.imageUrl = imageUrl;
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                message: 'No fields to update'
            });
        }

        const category = await prisma.category.update({
            where: { id },
            data
        });

        return res.status(200).json({ data: category });

    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Server error' });
    }
};