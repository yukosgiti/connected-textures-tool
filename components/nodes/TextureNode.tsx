import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";

import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemPreview,
    FileUploadList
} from "@/components/ui/file-upload";
import { useNodeData } from "@/hooks/store";
import { Image01FreeIcons, X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";
import { Button } from "../ui/button";


type Props = {
    id: string;
}




export const TextureNode = memo(({ id }: Props) => {
    const nodeData = useNodeData(id);
    const [files, setFiles] = React.useState<File[]>([]);

    const onFileReject = React.useCallback((file: File, message: string) => {

    }, []);
    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <FileUpload
                            maxFiles={1}
                            maxSize={5 * 1024 * 1024}
                            className="size-32"
                            value={files}
                            onValueChange={setFiles}
                            onFileReject={onFileReject}
                            onFileValidate={(file: File) => {
                                if (!file.type.startsWith("image/")) {
                                    return "Only image files are allowed";
                                }
                            }}

                        >
                            {files.length === 0 && <FileUploadDropzone className="size-32 rounded-none">
                                <div className="flex flex-col items-center gap-1 text-center">
                                    <p className="font-medium text-xs">Drag & drop texture</p>
                                </div>

                            </FileUploadDropzone>}
                            <FileUploadList className="border-none p-0">
                                {files.map((file, index) => (
                                    <FileUploadItem key={index} value={file} className="p-0 flex flex-col items-center gap-2 group">
                                        <FileUploadItemPreview className="size-32 p-0 rounded-none border-none" style={{
                                            backgroundImage: `url(${URL.createObjectURL(file)}), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333)`,
                                            backgroundSize: "cover, 16px 16px, 16px 16px",
                                            backgroundPosition: "center, 0 0, 8px 8px",
                                            imageRendering: "pixelated"
                                        }} />
                                        <FileUploadItemDelete asChild className="group-hover:flex hidden absolute top-1 right-1  rounded-full">
                                            <Button variant="ghost" size="icon" className="size-7">
                                                <HugeiconsIcon icon={X} className="size-4" />
                                            </Button>
                                        </FileUploadItemDelete>
                                    </FileUploadItem>
                                ))}
                            </FileUploadList>
                        </FileUpload>

                    </div>
                    <div className="flex  nodrag self-center relative isolate  w-full">

                    </div>
                </div>
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

TextureNode.displayName = "TextureNode";