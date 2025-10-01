import { FC, useState } from 'react';
import { Download, Trash2, File, Image, FileText, Archive, Eye, EyeOff, Upload, Info } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { useDeleteAttachmentMutation } from '../api/tasks-api';
import { toast } from 'sonner';
import type { TaskAttachment } from '@entities/task/model/types';
import FileUploader from './FileUploader';

interface TaskAttachmentsProps {
  taskId: number;
  attachments: TaskAttachment[];
  canEdit?: boolean;
  onAttachmentsChange?: () => void;
}

const TaskAttachments: FC<TaskAttachmentsProps> = ({
  taskId,
  attachments,
  canEdit = false,
  onAttachmentsChange,
}) => {
  const [showUploader, setShowUploader] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const deleteAttachmentMutation = useDeleteAttachmentMutation(taskId);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5" />;
    }
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="h-5 w-5" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return <Archive className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'bg-green-100 text-green-800';
    if (mimeType.includes('pdf')) return 'bg-red-100 text-red-800';
    if (mimeType.includes('document')) return 'bg-blue-100 text-blue-800';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleDownload = (attachment: TaskAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (attachmentId: number, filename: string) => {
    if (!confirm(`Удалить файл "${filename}"?`)) return;
    
    try {
      await deleteAttachmentMutation.mutateAsync(attachmentId);
      toast.success('Файл удален');
      onAttachmentsChange?.();
    } catch (error) {
      toast.error('Ошибка при удалении файла');
      console.error('Delete error:', error);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const imageCount = attachments.filter(att => isImage(att.mimeType)).length;
  const documentCount = attachments.filter(att => att.mimeType.includes('pdf') || att.mimeType.includes('document')).length;
  const otherCount = attachments.length - imageCount - documentCount;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Файлы ({attachments.length})</CardTitle>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploader(!showUploader)}
            >
              {showUploader ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Скрыть загрузку
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Добавить файлы
                </>
              )}
            </Button>
          )}
        </div>
        
        {attachments.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>Общий размер: {formatFileSize(totalSize)}</span>
            </div>
            {imageCount > 0 && (
              <div className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                <span>Изображения: {imageCount}</span>
              </div>
            )}
            {documentCount > 0 && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Документы: {documentCount}</span>
              </div>
            )}
            {otherCount > 0 && (
              <div className="flex items-center gap-1">
                <File className="h-3 w-3" />
                <span>Другие: {otherCount}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showUploader && canEdit && (
          <FileUploader
            taskId={taskId}
            multiple={true}
            maxFiles={10}
            onUploadSuccess={() => {
              setShowUploader(false);
              onAttachmentsChange?.();
            }}
          />
        )}

        {attachments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Нет прикрепленных файлов</p>
            {canEdit && (
              <p className="text-sm mt-1">Нажмите "Добавить файлы" для загрузки</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {isImage(attachment.mimeType) ? (
                    <>
                      <button 
                        className="relative group"
                        onClick={() => setPreviewOpen(true)}
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.originalName}
                          className="w-12 h-12 object-cover rounded border cursor-pointer group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                      
                      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{attachment.originalName}</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <img
                              src={attachment.url}
                              alt={attachment.originalName}
                              className="max-w-full max-h-[70vh] object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border">
                      {getFileIcon(attachment.mimeType)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{attachment.originalName}</p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getFileTypeColor(attachment.mimeType)}`}
                    >
                      {attachment.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>Загружен {formatDate(attachment.uploadedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title="Скачать файл"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id, attachment.originalName)}
                      disabled={deleteAttachmentMutation.isPending}
                      title="Удалить файл"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskAttachments;