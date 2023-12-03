"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth, useUser } from "@clerk/clerk-react";
import { Accessibility } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings } from "@/hooks/use-settings";
import { Spinner } from "@/components/Spinner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
 
interface UserProps {
  id:string;
  username:string;
  email:string;
  image:string
}

const Member = () => {
  const {getToken} = useAuth();
  const {user} = useUser()
  const params = useParams()
  const [open,setOpen] = useState(false)
  const [users,setUsers] = useState([]);
  const [collab,setCollab] = useState<any>([])
  const [collabMember,setCollabMember] = useState([])
  const userId:string = user?.id ? user.id : "";
  const createCollaborator = useMutation(api.documents.createCollaborator)
  const removeCollab = useMutation(api.documents.removeCollab)
  const getCollabUsers = useQuery(api.documents.getCollabUsers,{documentId:params.documentId as Id<"documents">})

  const fetchData = async () => {
    fetch("/api/clerk", {
      headers: { Authorization: `Bearer ${await getToken()}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setUsers(data.data)
      });
    return;
  };

  const handleCreateCollaborator = async (collaboratorId:string) => {
    try {
      
      if (userId === undefined) {
        return;
      }
      const data = {
        "collaboratorId": collaboratorId,
        "collaboratorUserId": userId,
        "docsId": params.documentId as Id<"documents">
      };
        if (data) {
        const result = await createCollaborator(data);
        console.log(result)
        if(result){
          toast.success('Collaborator added successfully');
        }
      }
    } catch (error) {
      // Handle errors, log them, or show an error message to the user
      console.error('Error creating collaborator:', error);
      toast.error('Error creating collaborator. Please try again.');
    }
  };
   
  useEffect(()=>{
    fetchData()
    if(getCollabUsers){
      const collabUserIds = getCollabUsers.map(user => user.collaboratorUserId);
      const collabUserMemberIds = getCollabUsers.map(user => user.collaboratorId);
      const collabMember = users.filter(user => collabUserMemberIds.includes(user?.id));
      const collabUsers = users.filter(user => collabUserIds.includes(user?.id));
      setCollabMember(collabMember)
      setCollab(collabUsers[0]);
    }
  },[users,getCollabUsers])
    
    const handleRemoveCollab =async (collabId:string) => {
      try{
        let identity = "" 
        if(getCollabUsers){
          for (const obj of getCollabUsers) {
            if (obj.collaboratorId === collabId && obj.docsId === params.documentId) {
                identity =obj._id;
            }
          }        
        }
        console.log(identity)
        const result = await removeCollab({id:identity as Id<"collaborator">})
        console.log(result)
      }catch(err){
        console.log(err)
      }
    }
 
    return (
    <Dialog>
      <DialogTrigger asChild onClick={fetchData}>
        {
          !!collab ? (
            <>
            <Avatar 
              onClick={() => setOpen(true)} 
              className="cursor-pointer"
            >
              <AvatarImage src={collab.image}/>
              <AvatarFallback>AR</AvatarFallback>
            </Avatar> 
            </>
        ): (
            <Button 
            size="sm" 
            variant="ghost" 
            className="bg-red-600" 
          
            >
              Make Collaborator
            </Button>
          )
        }

      </DialogTrigger>
      <DialogContent
        forceMount
      >
        <div className="flex flex-col items-center justify-center ">
            <Accessibility
              className="h-8 w-8 text-muted-foreground mb-2"
            />
            <p className="text-sm font-medium mb-2">
              Access to your Member
            </p>
            <span className="text-xs text-muted-foreground mb-4">
              Share your work with your member.
            </span>
            <div className="mt-4 flex justify-start items-start flex-col">
            <span className="text-sm text-muted-foreground font-bold mb-2">
              Collaborators {users.length || ''}
            </span>
            {collabMember.length && (
                collabMember && (collabMember.map((item:any) => (
                  (<div
                    className="
                    py-4 px-2 
                      flex
                      items-center
                      gap-x-6
                      w-96"
                    key={item.id}
                    
                  >
                    <div className="flex gap-2 items-center w-60">
                      <Avatar>
                        <AvatarImage src={item.image} />
                        <AvatarFallback>AR</AvatarFallback>
                      </Avatar>
                      <div
                        className="text-sm 
                          gap-2
                          text-muted-foreground
                          overflow-hidden
                          overflow-ellipsis
                          sm:w-[300px]   
                        "
                      >
                      {item && item.email && item.email.length>0 && item.email[0] && item.email[0]?.emailAddress}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={()=> handleRemoveCollab(item.id)}
                      className=""
                    >
                      Remove
                    </Button>
                  </div>))  
                )) 
              ) 
            }
            <div className="text-sm text-muted-foreground font-bold mb-2">make collaborator</div>
            <ScrollArea
              className="
            h-[120px]
            overflow-y-scroll
            w-[95%]
            rounded-md
            border
            border-muted-foreground/20"
            >
              {users.length ? (
                users ? ( users.map((item:any) => (
                  item.id !== userId &&(<div
                    className="
                    py-4 px-2 
                      flex
                      items-center
                      gap-x-6
                      w-96"
                    key={item.id}
                  >
                    <div className="flex gap-2 items-center w-60">
                      <Avatar>
                        <AvatarImage src={item.image} />
                        <AvatarFallback>AR</AvatarFallback>
                      </Avatar>
                      <div
                        className="text-sm 
                          gap-2
                          text-muted-foreground
                          overflow-hidden
                          overflow-ellipsis
                          sm:w-[300px]   
                        "
                      >
                      {item && item.email && item.email.length>0 && item.email[0] && item.email[0]?.emailAddress}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleCreateCollaborator(item?.id)}
                      className=""
                    >
                      Add
                    </Button>
                  </div>))  
                )) : <div>
                  <Spinner
                    size={"sm"}
                  />
                </div>
              ) : (
                <div
                  className="
                  py-4 px-2 
                  flex
                  items-center
                  gap-x-6
                  w-96"
                >
                  <span className="text-muted-foreground text-sm">
                    You have no collaborators
                  </span>
                </div>
              )}
            </ScrollArea>
          </div>
        </div> 
      </DialogContent>
    </Dialog>
    );
}
 
export default Member;