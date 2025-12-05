import { useState, useImperativeHandle, forwardRef } from 'react';
import { FileText, Trash2, Eye, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUploadHistory, UploadRecord } from '@/hooks/useUploadHistory';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface UploadHistoryRef {
  refresh: () => void;
}

export const UploadHistory = forwardRef<UploadHistoryRef>((_, ref) => {
  const { records, isLoading, isDeleting, fetchHistory, deleteUpload } = useUploadHistory();

  useImperativeHandle(ref, () => ({
    refresh: fetchHistory,
  }));
  const [selectedRecord, setSelectedRecord] = useState<UploadRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  const handleViewDetail = (record: UploadRecord) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const handleDelete = async (assessmentId: number) => {
    await deleteUpload(assessmentId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">最近上传</CardTitle>
          <CardDescription>查看最近的上传记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">最近上传</CardTitle>
              <CardDescription>查看最近的上传记录，支持查看详情和删除</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无上传记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.assessmentId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {record.schoolName} - {record.gradeLevel}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {record.academicYear}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {record.month}月{record.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(record.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-accent">
                        {record.studentCount} 人
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.scoreCount} 条成绩
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(record)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除这条上传记录吗？此操作将删除该考试的所有成绩数据，且无法恢复。
                              <br /><br />
                              <strong>考试信息：</strong>
                              <br />
                              {record.schoolName} - {record.gradeLevel}
                              <br />
                              {record.academicYear} {record.month}月{record.type}
                              <br />
                              共 {record.studentCount} 名学生，{record.scoreCount} 条成绩记录
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(record.assessmentId)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传详情</DialogTitle>
            <DialogDescription>查看本次上传的详细信息</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">学校</p>
                  <p className="font-medium">{selectedRecord.schoolName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">年级</p>
                  <p className="font-medium">{selectedRecord.gradeLevel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">学年</p>
                  <p className="font-medium">{selectedRecord.academicYear}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">考试类型</p>
                  <p className="font-medium">{selectedRecord.month}月{selectedRecord.type}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary-soft rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{selectedRecord.studentCount}</p>
                    <p className="text-sm text-muted-foreground">参考学生数</p>
                  </div>
                  <div className="p-4 bg-accent-soft rounded-lg text-center">
                    <p className="text-2xl font-bold text-accent">{selectedRecord.scoreCount}</p>
                    <p className="text-sm text-muted-foreground">成绩记录数</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 text-sm text-muted-foreground">
                <p>考试ID: {selectedRecord.assessmentId}</p>
                <p>上传时间: {formatDate(selectedRecord.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

UploadHistory.displayName = 'UploadHistory';
