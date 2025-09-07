import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.xlsx,.xls,.csv',
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  className
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxSize,
    multiple: false,
    disabled
  });

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (selectedFile) {
    return (
      <div className={cn("border-2 border-dashed border-muted rounded-lg p-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer transition-colors",
        isDragActive && "border-primary/50 bg-primary/5",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">
        {isDragActive ? '放开鼠标以上传文件' : '拖拽文件到此处'}
      </h3>
      <p className="text-muted-foreground mb-4">或点击选择文件上传</p>
      <Button variant="outline" size="lg" className="text-base px-8" disabled={disabled}>
        选择文件
      </Button>
      <div className="mt-4 text-sm text-muted-foreground">
        <p>支持的格式：.xlsx, .xls, .csv</p>
        <p>最大文件大小：10MB</p>
      </div>
    </div>
  );
};