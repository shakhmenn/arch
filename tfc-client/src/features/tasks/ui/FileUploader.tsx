import { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { useUploadAttachmentMutation, useUploadMultipleAttachmentsMutation } from '../api/tasks-api';
import { toast } from 'sonner';

interface FileUploaderProps {
  taskId: number;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // в байтах
  acceptedTypes?: string[];
  onUploadSuccess?: () => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

const FileUploader: FC<FileUploaderProps> = ({
  taskId,
  multiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  onUploadSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const uploadSingleMutation = useUploadAttachmentMutation(taskId);
  const uploadMultipleMutation = useUploadMultipleAttachmentsMutation(taskId);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setErrors([]);
    
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map((e: any) => {
          switch (e.code) {
            case 'file-too-large':
              return `Файл "${file.name}" слишком большой (максимум ${maxSize / 1024 / 1024}MB)`;
            case 'file-invalid-type':
              return `Файл "${file.name}" имеет недопустимый тип`;
            case 'too-many-files':
              return `Слишком много файлов (максимум ${maxFiles})`;
            default:
              return `Ошибка с файлом "${file.name}"`;
          }
        });
        return errorMessages.join(', ');
      });
      setErrors(newErrors);
    }

    if (acceptedFiles.length > 0) {
      const filesWithPreview = acceptedFiles.map(file => {
        const fileWithPreview = file as FileWithPreview;
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }
        return fileWithPreview;
      });
      
      if (multiple) {
        setSelectedFiles(prev => [...prev, ...filesWithPreview].slice(0, maxFiles));
      } else {
        setSelectedFiles(filesWithPreview.slice(0, 1));
      }
    }
  }, [maxFiles, maxSize, multiple]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple,
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index]?.preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      if (multiple && selectedFiles.length > 1) {
        await uploadMultipleMutation.mutateAsync(selectedFiles);
        toast.success(`Загружено ${selectedFiles.length} файлов`);
      } else {
        await uploadSingleMutation.mutateAsync(selectedFiles[0]);
        toast.success('Файл успешно загружен');
      }
      
      // Очистка после успешной загрузки
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setSelectedFiles([]);
      setErrors([]);
      onUploadSuccess?.();
    } catch (error) {
      toast.error('Ошибка при загрузке файлов');
      console.error('Upload error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isUploading = uploadSingleMutation.isPending || uploadMultipleMutation.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Отпустите файлы здесь...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <p className="text-sm text-muted-foreground">
                  {multiple ? `Максимум ${maxFiles} файлов` : 'Один файл'}, до {maxSize / 1024 / 1024}MB каждый
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive mb-1">Ошибки загрузки:</h4>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Выбранные файлы:</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <File className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Badge variant="outline">{file.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="min-w-[120px]"
              >
                {isUploading ? 'Загрузка...' : `Загрузить (${selectedFiles.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploader;