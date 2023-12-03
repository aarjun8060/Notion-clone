import { v } from "convex/values"
import {mutation,query} from "./_generated/server"
import {Doc,Id} from "./_generated/dataModel"

export const archive = mutation({
    args : {id:v.id("documents")},
    handler :async (ctx,args) => {
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;
        
        const existingDocument = await ctx.db.get(args.id)

        if(!existingDocument){
            throw new Error("Not found")
        }

        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized")
        }

        const recursiveArchive = async (documentId:Id<"documents">) => {
            const children =await ctx.db
            .query("documents")
            .withIndex("by_user_parent",(q)=>(
                q.eq("userId",userId)
                .eq("parentDocument",documentId)
                
            ))
            .collect();

            for(const child of children){
                await ctx.db.patch(child._id,{
                    isArchived:true,
                });

                await recursiveArchive(child._id);
            }
        }


        const document = await ctx.db.patch(args.id,{
            isArchived:true,
        })
        
        recursiveArchive(args.id)

        return document;
    }   
})

export const getSidebar = query({
    args:{
        parentDocument:v.optional(v.id("documents")),
        userId:v.optional(v.string()),
        docsId:v.optional(v.id("documents"))
    },
    handler : async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity){
            throw new Error("not authenticated")
        }  
        let userId = identity.subject;
        let documents = [];
        if(args.userId && args.docsId){
            userId = args.userId ? args.userId : ""
            let docsId = args.docsId ? args.docsId : ""
            documents = await ctx.db
                        .query("documents")
                        .filter((q)=> q.eq(q.field("_id"),docsId))
                        .filter((q)=> q.eq(q.field("isArchived"),false))
                        .order("desc")
                        .collect()
        }else{
        documents = await ctx.db
                        .query("documents")
                        .withIndex("by_user_parent",(q)=> q.eq("userId",userId).eq("parentDocument", args.parentDocument))
                        .filter((q)=> q.eq(q.field("isArchived"),false))
                        .order("desc")
                        .collect()
        }
        
        return documents;
    }
})
export const get = query({
    handler:async (ctx) =>{
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated")
        }
        const documents = await ctx.db.query("documents").collect()

        return documents;
    }
})

export const create = mutation({
    args: {
        title: v.string(),
        parentDocument:v.optional(v.id("documents"))
    },
    handler : async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("not authenticated")
        }

        const userId = identity.subject;
        const document = await ctx.db.insert("documents",{
            title:args.title,
            parentDocument:args.parentDocument,
            userId,
            isArchived:false,
            isPublished:false,
        })

        return document;
     }
})

export const getTrash = query({
    handler:async (ctx ) => {
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const documents = await ctx.db
                        .query("documents")
                        .withIndex("by_user",(q)=> q.eq("userId",userId))
                        .filter((q)=> q.eq(q.field("isArchived"),true))
                        .order("desc")
                        .collect()
        
        return documents;
    }
});

export const restore = mutation({
    args : {id:v.id("documents")},
    handler :async (ctx,args) => {
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id)

        if(!existingDocument){
            throw new Error("Not found")
        }

        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized")
        }

        const recursiveRestore = async (documentId: Id<"documents">)=>{
            const children =await ctx.db
            .query("documents")
            .withIndex("by_user_parent",(q)=>(
                q.eq("userId",userId)
                .eq("parentDocument",documentId)
                
            ))
            .collect();

            for(const child of children){
                await ctx.db.patch(child._id,{
                    isArchived:false,
                });

                await recursiveRestore(child._id);
            } 
        }

        const options: Partial<Doc<"documents">> = {
            isArchived : false,
        }

        if(existingDocument.parentDocument){
            const parent = await ctx.db.get(existingDocument.parentDocument);

            if(parent?.isArchived){
                options.parentDocument = undefined;
            }
        }

        const document = await ctx.db.patch(args.id,options);

        recursiveRestore(args.id);

        return document;
    }
});

export const remove = mutation({
    args : {id:v.id("documents")},
    handler :async (ctx,args) => {
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id)

        if(!existingDocument){
            throw new Error("Not found")
        }

        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized")
        }

        const document = await ctx.db.delete(args.id);

        return document;
    }
});

export const getSearch = query({
    handler: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }
  
      const userId = identity.subject;
  
      const documents = await ctx.db.query("documents").withIndex("by_user", (q) => q.eq("userId", userId)).filter((q) =>q.eq(q.field("isArchived"), false)).order("desc").collect()

        return documents;
    }
});

export const getById = query({
    args:{
        documentId:v.id("documents"),
    },
    handler: async (ctx,args) => {
        const identity = await ctx.auth.getUserIdentity();       
        const document = await ctx.db.get(args.documentId)
        const collab = await ctx.db.get(args.documentId)

        if(!document){
            throw new Error("Not Found")
        }

        if(document.isPublished && !document.isArchived){
            return document;
        }

        if(!identity){
            throw new Error("Not authenticated");
        }

        const userId =  identity.subject;
        if(document.userId !== userId){
            if(document.userId === collab?.userId){
                return document
            }else{
                throw new Error("Unauthorized")
            }
        }

        return document;
    } 
})

export const update = mutation({
    args:{
        id:v.id("documents"),
        title:v.optional(v.string()),
        content:v.optional(v.string()),
        coverImage:v.optional(v.string()),
        icon:v.optional(v.string()),
        isPublished:v.optional(v.boolean()),
    },
    handler: async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity){
            throw new Error("unauthenticated");
        }

        const userId = identity.subject;

        const {id,...rest} = args;

        const existingDocument = await ctx.db.get(args.id);
        const collab = await ctx.db.get(args.id)
        if(!existingDocument){
            throw new Error("not found");
        }
        
       
        
        const document = await ctx.db.patch(args.id,{
            ...rest
        });

        if(existingDocument.userId !== userId){
            if(existingDocument.userId === collab?.userId){
                return document;
            }else{
                throw new Error("Unauthorized")
            }
        }
        return document;
    }
})

export const removeIcon = mutation({
    args:{ id:v.id("documents")},
    handler: async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity){
            throw new Error("unauthenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if(!existingDocument){
            throw new Error("not found");
        }
        
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized")
        }

        const document = await ctx.db.patch(args.id,{
            icon:undefined
        });

        return document;

    }
})

export const removeCoverImage = mutation({
    args:{ id:v.id("documents")},
    handler: async(ctx,args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity){
            throw new Error("unauthenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if(!existingDocument){
            throw new Error("not found");
        }
        
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized")
        }

        const document = await ctx.db.patch(args.id,{
            coverImage:undefined
        });
        return document;

    }
})

export const createCollaborator = mutation({
    args: {
        collaboratorId: v.string(),
        collaboratorUserId: v.string(),
        docsId:v.id("documents"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
  
        if (!identity) {
            throw new Error("Not authenticated");
        }
  
        const userId = identity.subject;
  
        const collaboratorData = await ctx.db.insert("collaborator", {
            collaboratorId: args.collaboratorId,
            collaboratorUserId: args.collaboratorUserId,
            isDeleted: false, // Provide a default value for isDeleted
            docsId: args.docsId, // Include the foreign key reference
        });
  
        return collaboratorData;
    }
});

export const getColloborator = query({
    args:{ 
        id: v.optional(v.string()),
    },
    handler:async (ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;
        const collaborator = await ctx.db.query("collaborator")
            .filter((q) => q.eq(q.field("collaboratorId"), args.id))
            .filter((q)=> q.eq(q.field("isDeleted"),false))
            .collect()
             

        return collaborator;
    } 
})

export const getCollabUsers = query({
    args:{
        documentId:v.id("documents")
    },
    handler:async (ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated");
        }

        const users = await ctx.db.query("collaborator")
                .filter((q)=>q.eq(q.field("docsId"),args.documentId))
                .filter((q)=>q.eq(q.field("isDeleted"),false))
                .collect()
         
        return users
    }
})

export const removeCollab = mutation({
    args:{
        id:v.id("collaborator"),
    },
    handler:async(ctx, args) =>{
        try{
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated");
        }
       
        const userId = identity.subject;
        const collab = await ctx.db.delete(args?.id)
        return true;
        }catch(err){
            return false
            console.log(err)
        }
    },
})