"use client";
import { useTheme } from "next-themes";
import { useEdgeStore } from "@/lib/edgestore";
import {  Editor } from "novel";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  documentId?:string;
};

const NovelEditor = ({
  onChange,
  initialContent,
  documentId
  // editable
}: EditorProps) => {
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<string>("Saved");
  let content;
  if (initialContent) {
    content = JSON.parse(initialContent);
  } else {
    console.error('Initial content is undefined');
  }
  useEffect(()=>{
    let novel_content = localStorage.getItem(`${documentId}`);
    if(novel_content){
      onChange(novel_content);
      if(saveStatus === "Saved"){
        localStorage.removeItem(`${documentId}`)
        toast.success(`${saveStatus}`)
      }
    }
  },[saveStatus])
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ 
      file
    });

    return response.url;
  }


  return (
    <div>
      <Editor
        defaultValue={content}
        onUpdate={() => {
          
          setSaveStatus("Unsaved");
        }}
        onDebouncedUpdate={() => {
          router.refresh();
          setSaveStatus("Saving...");
          setTimeout(() => {
            setSaveStatus("Saved");
          }, 750);
        }}
        storageKey={documentId}
        className="shadow-sm w-full"
      />
    </div>
  )
}

export default NovelEditor;
