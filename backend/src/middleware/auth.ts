import "dotenv/config";
import type { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken";
import { resolveTripleslashReference } from "typescript";

export interface AuthRequest extends Request{
    user?:{userId: string, role :String}
}

function unauthorized (res:Response){
    return res.status(401).json({
        message : "Unauthorised User"
    })
}
export async function authMiddleware(req:AuthRequest,res:Response, next :NextFunction){
    const token =  req.headers.authorization?.split(" ")[1];

    if(!token){
        unauthorized(res)
    }

    const jwtSrcret = process.env.JWT_SECRET;

    if(!jwtSrcret){
        throw new Error("JWT is missing")
    }


    try {
        const decoded = jwt.verify(token as string, jwtSrcret) as jwt.JwtPayload | string;
        if (typeof decoded === 'string' || !decoded || !('userId' in decoded) || !('role' in decoded)) {
            return unauthorized(res);
        }
        req.user = {
            userId: (decoded as any).userId,
            role: (decoded as any).role
        };
        next()
    } catch (e) {

        return res.status(500).json({
            message : "Invalid token or experied token"
        })
    }
}


export function requireRole(role : String[]){
    return(req:AuthRequest,res:Response,next:NextFunction)=>{

        if(!req.user||!role.includes(req.user.role)){
            return res.status(501).json({
                message : "Role is required"
            })
        }

        next();
    }
}

