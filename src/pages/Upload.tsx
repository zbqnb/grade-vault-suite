import { Upload as UploadIcon, FileText, Users, BookOpen, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Upload = () => {
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
              <span>当前学期：2024春季</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2">
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
              <CardContent>
                <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                  <UploadIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">拖拽文件到此处</h3>
                  <p className="text-muted-foreground mb-4">或点击选择文件上传</p>
                  <Button variant="outline" size="lg" className="text-base px-8">
                    选择文件
                  </Button>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>支持的格式：.xlsx, .xls, .csv</p>
                    <p>最大文件大小：10MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
    </div>
  );
};

export default Upload;