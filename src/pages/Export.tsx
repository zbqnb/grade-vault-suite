import { useState, useMemo } from "react"; 
import { Download, FileText, PieChart, BarChart3, TrendingUp, Calendar } from "lucide-react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button"; 
import { Badge } from "@/components/ui/badge"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Label } from "@/components/ui/label"; 
import { supabase } from "@/integrations/supabase/client"; 
import { useToast } from "@/hooks/use-toast"; 
import * as XLSX from 'xlsx'; 

const Export = () => { 
  const [selectedType, setSelectedType] = useState(""); 
  const [selectedGrade, setSelectedGrade] = useState(""); 
  const [selectedMonth, setSelectedMonth] = useState(""); 
  const [selectedExamType, setSelectedExamType] = useState(""); 
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(""); 
  const [isExporting, setIsExporting] = useState(false); 
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
    
    if (currentMonth >= 9) { 
      return `${currentYear}-${currentYear + 1}`; 
    } else { 
      return `${currentYear - 1}-${currentYear}`; 
    } 
  }, []); 

  // 学年选项
  const academicYears = useMemo(() => { 
    const current = currentAcademicYear; 
    const currentStartYear = parseInt(current.split('-')[0]); 
    const years = []; 
    
    for (let i = 0; i < 3; i++) { 
      const startYear = currentStartYear - i; 
      years.push(`${startYear}-${startYear + 1}`); 
    } 
    
    return years; 
  }, [currentAcademicYear]); 

  // 检查导出参数是否完整
  const isRankingParamsComplete = selectedGrade && selectedMonth && selectedExamType && selectedAcademicYear; 

  cconst handleClassRankingExport = async () => { 
  if (!isRankingParamsComplete) { 
    toast({ 
      title: "参数不完整", 
      description: "请选择所有必需参数", 
      variant: "destructive", 
    }); 
    return; 
  } 

  setIsExporting(true); 
  try { 
    // 1. 查找所有符合条件的考试
    const { data: assessments, error: assessmentError } = await supabase 
      .from('assessments') 
      .select('id') 
      .eq('grade_level', selectedGrade) 
      .eq('month', parseInt(selectedMonth)) 
      .eq('type', selectedExamType) 
      .eq('academic_year', selectedAcademicYear); 

    if (assessmentError) throw assessmentError; 
    
    if (!assessments || assessments.length === 0) { 
      toast({ 
        title: "未找到考试数据", 
        description: "没有找到符合条件的考试记录", 
        variant: "destructive", 
      }); 
      setIsExporting(false);
      return; 
    } 

    const assessmentIds = assessments.map(a => a.id); 

    // 2. 使用更精确的查询，获取每个学生每科的最新成绩
    const { data: scores, error: scoresError } = await supabase 
      .from('individual_scores') 
      .select(` 
        score_value, 
        students(id, name, class_id, classes(name, school_id, schools(name))), 
        subjects(name),
        assessment_id
      `) 
      .in('assessment_id', assessmentIds)
      .order('created_at', { ascending: false }); // 按时间排序，确保获取最新成绩

    if (scoresError) throw scoresError; 

    if (!scores || scores.length === 0) { 
      toast({ 
        title: "未找到成绩数据", 
        description: "该考试暂无成绩记录", 
        variant: "destructive", 
      });
      setIsExporting(false);
      return; 
    } 

    // 3. 精确的数据处理：确保每个学生每科只计算一次
    const classSubjectData: { 
      [key: string]: { 
        [subject: string]: { 
          studentScores: number[]; // 存储每个学生的成绩
          schoolName: string;
        } 
      } 
    } = {}; 
    
    // 用于去重的Map：记录每个学生每科是否已经计算过
    const processedStudents: { [key: string]: Set<string> } = {};
    
    scores.forEach((score: any) => { 
      if (!score.students || !score.subjects || !score.students.classes || !score.students.classes.schools) return; 
      
      const studentId = score.students.id;
      const className = score.students.classes.name; 
      const schoolName = score.students.classes.schools.name; 
      const subjectName = score.subjects.name; 
      const scoreValue = parseFloat(score.score_value); 
      
      if (!className || !schoolName || !subjectName || isNaN(scoreValue)) return; 
      
      const classKey = `${schoolName}-${className}`; 
      const studentSubjectKey = `${studentId}-${subjectName}`;
      
      // 初始化数据结构
      if (!classSubjectData[classKey]) { 
        classSubjectData[classKey] = {}; 
        processedStudents[classKey] = new Set();
      } 
      
      if (!classSubjectData[classKey][subjectName]) { 
        classSubjectData[classKey][subjectName] = { 
          studentScores: [], 
          schoolName 
        }; 
      } 
      
      // 确保每个学生每科只计算一次（取最新成绩）
      if (!processedStudents[classKey].has(studentSubjectKey)) {
        classSubjectData[classKey][subjectName].studentScores.push(scoreValue);
        processedStudents[classKey].add(studentSubjectKey);
      }
    }); 

    // 4. 计算精确的平均分并构建导出数据 
    const exportData: any[] = []; 
    const allSubjects = new Set<string>(); 
    
    // 收集所有科目 
    Object.values(classSubjectData).forEach(classData => { 
      Object.keys(classData).forEach(subject => allSubjects.add(subject)); 
    }); 
    
    const sortedSubjects = Array.from(allSubjects).sort(); 
    
    // 构建每一行数据 
    Object.entries(classSubjectData).forEach(([classKey, subjects]) => { 
      const [schoolName, className] = classKey.split('-'); 
      const row: any = { 
        '学校': schoolName, 
        '班级': className 
      }; 
      
      sortedSubjects.forEach(subject => { 
        if (subjects[subject] && subjects[subject].studentScores.length > 0) { 
          // 计算真正的班级平均分：所有学生成绩的总和除以学生人数
          const studentScores = subjects[subject].studentScores;
          const totalScore = studentScores.reduce((sum, score) => sum + score, 0);
          const avg = totalScore / studentScores.length;
          row[subject] = Math.round(avg * 100) / 100; // 保留两位小数 
        } else { 
          row[subject] = ''; 
        } 
      }); 
      
      exportData.push(row); 
    }); 

    // 5. 按学校和班级排序 
    exportData.sort((a, b) => { 
      if (a['学校'] !== b['学校']) { 
        return a['学校'].localeCompare(b['学校']); 
      } 
      return a['班级'].localeCompare(b['班级'], undefined, { numeric: true }); 
    }); 

    // 6. 生成Excel文件 
    const worksheet = XLSX.utils.json_to_sheet(exportData); 
    const workbook = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(workbook, worksheet, "班级各科平均分排名"); 
    
    const fileName = `班级平均分排名_${selectedAcademicYear}_${selectedGrade}_${selectedMonth}月_${selectedExamType}.xlsx`; 
    XLSX.writeFile(workbook, fileName); 

    toast({ 
      title: "导出成功", 
      description: `已生成 ${fileName}`, 
    }); 

  } catch (error) { 
    console.error('Export error:', error); 
    toast({ 
      title: "导出失败",  
      description: "数据导出过程中出现错误", 
      variant: "destructive", 
    }); 
  } finally { 
    setIsExporting(false); 
  } 
};

  const exportOptions = [ 
    { 
      id: "grades", 
      title: "成绩报表", 
      description: "学生成绩详细报表，包含各科目分数", 
      icon: FileText, 
      format: ["Excel", "PDF"], 
      color: "text-blue-600", 
      bgColor: "bg-blue-50" 
    }, 
    { 
      id: "statistics",  
      title: "统计分析", 
      description: "成绩分布、平均分、排名等统计数据", 
      icon: PieChart, 
      format: ["Excel", "CSV"], 
      color: "text-green-600", 
      bgColor: "bg-green-50" 
    }, 
    { 
      id: "trends", 
      title: "趋势分析",  
      description: "学生成绩变化趋势和学习进步情况", 
      icon: TrendingUp, 
      format: ["PDF", "图片"], 
      color: "text-purple-600", 
      bgColor: "bg-purple-50" 
    }, 
    { 
      id: "comparison", 
      title: "对比分析", 
      description: "班级对比、年级对比、历史对比分析", 
      icon: BarChart3, 
      format: ["Excel", "PDF"], 
      color: "text-orange-600",  
      bgColor: "bg-orange-50" 
    } 
  ]; 

  return ( 
    <div className="min-h-screen bg-background"> 
      {/* Header */} 
      <header className="border-b bg-card"> 
        <div className="container mx-auto px-6 py-4"> 
          <div className="flex items-center justify-between"> 
            <div> 
              <h1 className="text-2xl font-bold text-primary">数据导出</h1> 
              <p className="text-muted-foreground mt-1">导出各类成绩统计报表</p> 
            </div> 
            <div className="flex items-center gap-2 text-sm text-muted-foreground"> 
              <Calendar className="h-4 w-4" /> 
              <span>最后更新：2024-03-15</span> 
            </div> 
          </div> 
        </div> 
      </header> 

      {/* Main Content */} 
      <main className="container mx-auto px-6 py-8"> 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> 
          {/* Export Options */} 
          <div className="lg:col-span-2"> 
            <div className="mb-6"> 
              <h2 className="text-xl font-semibold mb-2">选择导出类型</h2> 
              <p className="text-muted-foreground">根据需要选择不同的报表类型进行导出</p> 
            </div> 

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
              {/* 班级各科平均分排名导出卡片 */} 
              <Card  
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${ 
                  selectedType === "class-ranking" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50" 
                }`} 
                onClick={() => setSelectedType(selectedType === "class-ranking" ? "" : "class-ranking")} 
              > 
                <CardHeader className="pb-3"> 
                  <div className="flex items-center justify-between"> 
                    <div className="flex items-center gap-3"> 
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80"> 
                        <BarChart3 className="h-5 w-5 text-primary-foreground" /> 
                      </div> 
                      <div> 
                        <CardTitle className="text-lg font-semibold">班级各科平均分排名</CardTitle> 
                        <CardDescription className="text-sm"> 
                          导出指定考试中各班级各科平均分排名表格 
                        </CardDescription> 
                      </div> 
                    </div> 
                    <Badge variant="secondary" className="text-xs"> 
                      Excel 
                    </Badge> 
                  </div> 
                </CardHeader> 
                
                {selectedType === "class-ranking" && ( 
                  <CardContent className="pt-0 space-y-4"> 
                    <div className="grid grid-cols-2 gap-4"> 
                      <div className="space-y-2"> 
                        <Label className="text-sm font-medium">年级</Label> 
                        <Select value={selectedGrade} onValueChange={setSelectedGrade}> 
                          <SelectTrigger> 
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
                        <Label className="text-sm font-medium">月份</Label> 
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}> 
                          <SelectTrigger> 
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
                        <Label className="text-sm font-medium">考试类型</Label> 
                        <Select value={selectedExamType} onValueChange={setSelectedExamType}> 
                          <SelectTrigger> 
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
                        <Label className="text-sm font-medium">学年</Label> 
                        <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}> 
                          <SelectTrigger> 
                            <SelectValue placeholder="选择学年" /> 
                          </SelectTrigger> 
                          <SelectContent> 
                            {academicYears.map((year) => ( 
                              <SelectItem key={year} value={year}> 
                                {year} 
                              </SelectItem> 
                            ))} 
                          </SelectContent> 
                        </Select> 
                      </div> 
                    </div> 

                    {isRankingParamsComplete && ( 
                      <div className="p-3 bg-accent/10 rounded-lg border border-accent/20"> 
                        <p className="text-sm text-accent-foreground"> 
                          ✓ 参数已完成，可以开始导出 
                        </p> 
                      </div> 
                    )} 

                    <Button  
                      onClick={handleClassRankingExport} 
                      disabled={!isRankingParamsComplete || isExporting} 
                      className="w-full" 
                    > 
                      <Download className="h-4 w-4 mr-2" /> 
                      {isExporting ? "导出中..." : "导出排名表格"} 
                    </Button> 
                  </CardContent> 
                )} 
              </Card> 

              {exportOptions.map((option) => ( 
                <Card key={option.id} className="card-hover cursor-pointer"> 
                  <CardHeader> 
                    <div className="flex items-start justify-between"> 
                      <div className={`p-3 rounded-lg ${option.bgColor}`}> 
                        <option.icon className={`h-6 w-6 ${option.color}`} /> 
                      </div> 
                      <div className="flex gap-1"> 
                        {option.format.map((format) => ( 
                          <Badge key={format} variant="secondary" className="text-xs"> 
                            {format} 
                          </Badge> 
                        ))} 
                      </div> 
                    </div> 
                    <CardTitle className="text-lg">{option.title}</CardTitle> 
                    <CardDescription className="text-base"> 
                      {option.description} 
                    </CardDescription> 
                  </CardHeader> 
                  <CardContent> 
                    <Button className="w-full" size="lg"> 
                      <Download className="h-4 w-4 mr-2" /> 
                      导出 {option.title} 
                    </Button> 
                  </CardContent> 
                </Card> 
              ))} 
            </div> 

            {/* Recent Exports */} 
            <Card className="mt-8"> 
              <CardHeader> 
                <CardTitle className="text-lg">最近导出</CardTitle> 
                <CardDescription>查看最近的导出记录</CardDescription> 
              </CardHeader> 
              <CardContent> 
                <div className="space-y-4"> 
                  {[ 
                    { name: "班级平均分排名_2024-2025_初中二年级_3月_期中.xlsx", time: "2024-03-15 16:30", type: "班级排名", status: "已完成" }, 
                    { name: "高一年级期中成绩报表.xlsx", time: "2024-03-15 16:30", type: "成绩报表", status: "已完成" }, 
                    { name: "班级统计分析.pdf", time: "2024-03-14 14:20", type: "统计分析", status: "已完成" }, 
                    { name: "学期趋势分析.pdf", time: "2024-03-13 10:15", type: "趋势分析", status: "已完成" } 
                  ].map((item, index) => ( 
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg"> 
                      <div className="flex items-center gap-3"> 
                        <Download className="h-8 w-8 text-primary" /> 
                        <div> 
                          <p className="font-medium">{item.name}</p> 
                          <p className="text-sm text-muted-foreground">{item.time}</p> 
                        </div> 
                      </div> 
                      <div className="text-right"> 
                        <Badge variant="outline" className="mb-1">{item.type}</Badge> 
                        <p className="text-sm text-accent font-medium">{item.status}</p> 
                      </div> 
                    </div> 
                  ))} 
                </div> 
              </CardContent> 
            </Card> 
          </div> 

          {/* Sidebar */} 
          <div className="space-y-6"> 
            {/* Export Settings */} 
            <Card> 
              <CardHeader> 
                <CardTitle className="text-lg">导出设置</CardTitle> 
              </CardHeader> 
              <CardContent className="space-y-4"> 
                <div className="space-y-2"> 
                  <label className="text-sm font-medium">时间范围</label> 
                  <select className="w-full p-2 border rounded-lg"> 
                    <option>本学期</option> 
                    <option>上学期</option> 
                    <option>本学年</option> 
                    <option>自定义</option> 
                  </select> 
                </div> 
                
                <div className="space-y-2"> 
                  <label className="text-sm font-medium">年级范围</label> 
                  <select className="w-full p-2 border rounded-lg"> 
                    <option>全部年级</option> 
                    <option>初中一年级</option> 
                    <option>初中二年级</option> 
                    <option>初中三年级</option> 
                  </select> 
                </div> 

                <div className="space-y-2"> 
                  <label className="text-sm font-medium">科目选择</label> 
                  <select className="w-full p-2 border rounded-lg"> 
                    <option>全部科目</option> 
                    <option>语文</option> 
                    <option>数学</option> 
                    <option>英语</option> 
                    <option>物理</option> 
                    <option>化学</option> 
                  </select> 
                </div> 

                <div className="pt-4 border-t"> 
                  <Button variant="outline" className="w-full"> 
                    应用设置 
                  </Button> 
                </div> 
              </CardContent> 
            </Card> 

            {/* Export Statistics */} 
            <Card> 
              <CardHeader> 
                <CardTitle className="text-lg">导出统计</CardTitle> 
              </CardHeader> 
              <CardContent className="space-y-4"> 
                <div className="grid grid-cols-2 gap-4 text-center"> 
                  <div className="p-3 bg-primary/10 rounded-lg"> 
                    <div className="text-2xl font-bold text-primary">156</div> 
                    <div className="text-sm text-muted-foreground">本月导出</div> 
                  </div> 
                  <div className="p-3 bg-accent/10 rounded-lg"> 
                    <div className="text-2xl font-bold text-accent">2.1GB</div> 
                    <div className="text-sm text-muted-foreground">文件总量</div> 
                  </div> 
                </div> 
                <div className="text-center p-3 bg-warning/10 rounded-lg"> 
                  <div className="text-lg font-bold text-warning">98.5%</div> 
                  <div className="text-sm text-muted-foreground">导出成功率</div> 
                </div> 
              </CardContent> 
            </Card> 
          </div> 
        </div> 
      </main> 
    </div> 
  ); 
}; 

export default Export;

