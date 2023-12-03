import { clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";



export async function GET(req: Request){
    try{
        const usersData = await clerkClient.users.getUserList();
        let users= [];
        for(let key of usersData){
            if(!key.username){
                users.push({
                    "username":key.username,
                    "email":key.emailAddresses,
                    "image":key.imageUrl,
                    "id":key.id
                })
            }else{
                users.push({
                    "username": `${key.firstName} ${key.lastName}` ,
                    "email":key.emailAddresses,
                    "image":key.imageUrl,
                    "id":key.id
                })
            }
        }
        return NextResponse.json({message:"success",status:200,data:users})
    }catch(error){
        console.log(error);
        throw error;
    }
}