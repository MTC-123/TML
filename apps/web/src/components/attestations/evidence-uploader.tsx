"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAttestationStore } from "@/store/attestation-store";
import { Upload, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EvidenceUploader() {
  const { evidenceFiles, addEvidence, removeEvidence } = useAttestationStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addEvidence(acceptedFiles);
    },
    [addEvidence],
  );

  const removeFile = (index: number) => {
    removeEvidence(index);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-accent bg-accent/5"
            : "border-muted-foreground/25 hover:border-primary"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drag and drop images, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, JPEG or WEBP up to 10MB each
        </p>
      </div>

      {/* File previews */}
      {evidenceFiles.length > 0 && (
        <div className="space-y-2">
          {evidenceFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <FileImage className="h-5 w-5 shrink-0 text-primary" />
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
