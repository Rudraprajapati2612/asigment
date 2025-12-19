import "dotenv/config"
import { Router } from "express";
import {prisma} from "../db.ts"
import bcrypt from "bcrypt";
import z from "zod";
import { Role } from "../generated/prisma/enums.ts";
import jwt from "jsonwebtoken";

export const authRouter = Router();

const signUpSchema = z.object({
    name : z.string(),
    email : z.email(),
    password : z.string(),
    role: z.nativeEnum(Role)
})

const loginSchema = z.object({
    email : z.email(),
    password : z.string()  
})
authRouter.post("/signup",async (req,res)=>{
    try{
        const parsedData = signUpSchema.safeParse(req.body);

        if(!parsedData.data){
            throw new Error("Fill complete form ")
        }
        if(!parsedData.success){
            res.status(400).json({
                message : "Validation Failed"
            })
        }

        const hassedpassword = await bcrypt.hash(parsedData.data.password,10);

        const user = await prisma.user.create({
            data:{
                name : parsedData.data.name,
                email:parsedData.data.email,
                password : hassedpassword,
                role : parsedData.data.role
            }
        })

        res.status(201).json({
            message: "User created successfully",
            userId: user.id,
          });

    }catch(e){  
        
        res.status(500).json({
            message: "Something went wrong",
        });
    }
})


authRouter.post("/login", async(req,res)=>{
    try{
    const parsedData = loginSchema.safeParse(req.body);

    if(!parsedData.data){
        throw new Error("Something is Missing")
    }
    let email = parsedData.data.email
    let password = parsedData.data.password;
    if (!parsedData.success){
        return res.status(401).json({
            message: "Invalid input "
        })
    }



    const user = await prisma.user.findUnique({where :{email}})
    
    if(!user||!user.password){
        return res.status(401).json({
            message : "all credentilas is required "
        })
    }

    const isValidUser = await bcrypt.compare(password,user.password);
    
    if(!isValidUser){
        return res.status(401).json({
            message : "Invalid Credentials "
        })
    }


    if(!process.env.JWT_SECRET){
        return res.status(500).json({ message: "JWT secret not configured" });
    }


    const token = jwt.sign(
        {userId : user.id, role : user.role},
        process.env.JWT_SECRET
    )

    res.status(201).json({
        message: "Login successful",
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        }
    })

    }catch(e){
        res.status(500).json({
            message: "Something went wrong",
        });
    }   
})