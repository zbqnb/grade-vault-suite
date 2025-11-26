import { useState, useMemo } from "react";
import { Upload as UploadIcon, FileText, Users, BookOpen, BarChart3, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { useExcelParser } from "@/hooks/useExcelParser";
import { useToast } from "@/hooks/use-toast";
import { AssessmentConfigDialog } from "@/components/AssessmentConfigDialog";

const Upload = () => {
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [currentAssessmentIds, setCurrentAssessmentIds] = useState<number[]>([]);
  
  const { parseExcelFile, isLoading } = useExcelParser();
  const { toast } = useToast();

  // 年级选项
  const grades = [
    "初中一年级",
    "初中二年级", 
    "初中三年级"
  ];

  // 月份选项 
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1}月`
  }));

  // 考试类型选项
  const examTypes = ["月考", "期中", "期末", "生地"];

  // 计算当前学年
  const currentAcademicYear = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // 如果当前月份在9月之后，学年为当前年份到下一年份
    if (currentMonth >= 9) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  }, []);

  // 检查是否所有筛选条件都已选择
  const isFilterComplete = selectedGrade && selectedMonth && selectedType;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !isFilterComplete) {
      toast({
        title: "上传失败",
        description: "请先完成所有筛选条件的选择和文件选择",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await parseExcelFile(selectedFile, {
        academicYear: currentAcademicYear,
        gradeLevel: selectedGrade,
        month: parseInt(selectedMonth),
        assessmentType: selectedType
      });
      
      // 获取所有考试ID并打开配置对话框
      if (result?.assessmentIds && result.assessmentIds.length > 0) {
        setCurrentAssessmentIds(result.assessmentIds);
        setShowConfigDialog(true);
      }
      
      // 重置表单
      setSelectedFile(null);
    } catch (error) {
      // 错误已在hook中处理
    }
  };

  const handleConfigSuccess = () => {
    toast({
      title: "配置完成",
      description: "考试配置已保存，可以继续使用系统",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">成绩上传</h1>
              <p className="text-muted-foreground mt-1">批量导入学生成绩数据</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>当前学年：{currentAcademicYear}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter Section */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Settings className="h-5 w-5 text-primary" />
                  上传设置
                </CardTitle>
                <CardDescription className="text-base">
                  请先选择以下筛选条件，确定成绩数据的归属信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade-select" className="text-base font-medium">年级</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger id="grade-select">
                        <SelectValue placeholder="选择年级" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="month-select" className="text-base font-medium">月份</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger id="month-select">
                        <SelectValue placeholder="选择月份" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type-select" className="text-base font-medium">考试类型</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger id="type-select">
                        <SelectValue placeholder="选择考试类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {examTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">学年</Label>
                    <div className="h-10 px-3 py-2 border border-input bg-background rounded-md flex items-center text-sm text-muted-foreground">
                      {currentAcademicYear}
                    </div>
                  </div>
                </div>

                {isFilterComplete && (
                  <div className="p-4 bg-accent-soft rounded-lg border border-accent/20">
                    <p className="text-sm text-accent-foreground">
                      ✓ 筛选条件已完成，现在可以上传文件
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Section */}
            {isFilterComplete && (
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UploadIcon className="h-5 w-5 text-primary" />
                    文件上传
                  </CardTitle>
                  <CardDescription className="text-base">
                    支持Excel、CSV格式的成绩数据文件
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    disabled={isLoading}
                  />
                  
                  {selectedFile && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleUpload}
                        disabled={isLoading}
                        size="lg"
                        className="px-8"
                      >
                        {isLoading ? "上传中..." : "开始上传"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upload History */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">最近上传</CardTitle>
                <CardDescription>查看最近的上传记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">高一年级期中考试成绩.xlsx</p>
                          <p className="text-sm text-muted-foreground">2024-03-15 14:30</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-accent">上传成功</p>
                        <p className="text-sm text-muted-foreground">456条记录</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">上传说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-primary">文件格式要求：</h4>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Excel表格(.xlsx, .xls)</li>
                    <li>• CSV逗号分隔文件</li>
                    <li>• 文件大小不超过10MB</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-primary">必需字段：</h4>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• 学号</li>
                    <li>• 姓名</li>
                    <li>• 班级</li>
                    <li>• 科目</li>
                    <li>• 成绩</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    下载模板文件
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  本学期统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-primary-soft rounded-lg">
                    <div className="text-2xl font-bold text-primary">1,245</div>
                    <div className="text-sm text-muted-foreground">学生总数</div>
                  </div>
                  <div className="p-3 bg-accent-soft rounded-lg">
                    <div className="text-2xl font-bold text-accent">28</div>
                    <div className="text-sm text-muted-foreground">上传次数</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-warning-soft rounded-lg">
                  <div className="text-2xl font-bold text-warning">95.2%</div>
                  <div className="text-sm text-muted-foreground">数据完整率</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AssessmentConfigDialog
        open={showConfigDialog}
        assessmentIds={currentAssessmentIds}
        onClose={() => setShowConfigDialog(false)}
        onSuccess={handleConfigSuccess}
      />
    </div>
  );
};

export default Upload;