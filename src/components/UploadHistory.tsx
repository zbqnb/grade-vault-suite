import { useState, useImperativeHandle, forwardRef } from 'react';
import { FileText, Trash2, Eye, Loader2, RefreshCw, School } from 'lucide-react';
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
import { useUploadHistory, ExamRecord } from '@/hooks/useUploadHistory';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface UploadHistoryRef {
  refresh: () => void;
}

export const UploadHistory = forwardRef<UploadHistoryRef>((_, ref) => {
  const { records, isLoading, isDeleting, fetchHistory, deleteExam } = useUploadHistory();
  const [selectedRecord, setSelectedRecord] = useState<ExamRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    refresh: fetchHistory,
  }));

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  const getExamKey = (record: ExamRecord) => {
    return `${record.academicYear}-${record.gradeLevel}-${record.month}-${record.type}`;
  };

  const handleViewDetail = (record: ExamRecord) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const handleDelete = async (assessmentIds: number[]) => {
    await deleteExam(assessmentIds);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">最近上传</CardTitle>
          <CardDescription>查看最近上传的考试记录</CardDescription>
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
              <CardDescription>查看最近上传的考试记录，支持查看详情和删除</CardDescription>
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
                  key={getExamKey(record)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {record.gradeLevel} · {record.month}月{record.type}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {record.academicYear}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <School className="h-3 w-3 mr-1" />
                          {record.schoolCount} 所学校
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
                              确定要删除这场考试的所有数据吗？此操作将删除所有相关学校的成绩数据，且无法恢复。
                              <br /><br />
                              <strong>考试信息：</strong>
                              <br />
                              {record.academicYear} {record.gradeLevel}
                              <br />
                              {record.month}月{record.type}
                              <br />
                              涉及 {record.schoolCount} 所学校，共 {record.studentCount} 名学生，{record.scoreCount} 条成绩记录
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(record.assessmentIds)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>考试详情</DialogTitle>
            <DialogDescription>查看本场考试的详细信息</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">学年</p>
                  <p className="font-medium">{selectedRecord.academicYear}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">年级</p>
                  <p className="font-medium">{selectedRecord.gradeLevel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">考试类型</p>
                  <p className="font-medium">{selectedRecord.month}月{selectedRecord.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">涉及学校</p>
                  <p className="font-medium">{selectedRecord.schoolCount} 所</p>
                </div>
              </div>
              
              {/* 学校列表 */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">参与学校</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.schoolNames.map((name, index) => (
                    <Badge key={index} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* 统计数据 */}
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
