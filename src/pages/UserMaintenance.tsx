import { useState, useEffect } from "react";
import { Users, School, BookOpen, UserCheck, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  grade_level: string;
  homeroom_teacher_name?: string;
}

interface Subject {
  id: number;
  name: string;
}

interface CourseAssignment {
  subject_id: number;
  teacher_name?: string;
}

interface ClassData extends Class {
  course_assignments: CourseAssignment[];
}

const UserMaintenance = () => {
  const { toast } = useToast();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsedClasses, setCollapsedClasses] = useState<Set<number>>(new Set());

  const academicYears = ["2024-2025", "2025-2026", "2026-2027"];
  const gradeOptions = ["初中一年级", "初中二年级", "初中三年级", "高中一年级", "高中二年级", "高中三年级"];

  // Helper function to extract class number for sorting
  const getClassNumber = (className: string): number => {
    const match = className.match(/(\d+)/);
    return match ? parseInt(match[1]) : 999;
  };

  // Sort classes by class number
  const sortedClasses = [...classes].sort((a, b) => getClassNumber(a.name) - getClassNumber(b.name));

  // Toggle class collapse state
  const toggleClassCollapse = (classId: number) => {
    setCollapsedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase.from("schools").select("id, name");
      if (error) {
        toast({
          title: "加载失败",
          description: "无法加载学校信息",
          variant: "destructive",
        });
      } else {
        setSchools(data || []);
      }
    };
    fetchSchools();
  }, [toast]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase.from("subjects").select("id, name").order("id");
      if (error) {
        toast({
          title: "加载失败",
          description: "无法加载科目信息",
          variant: "destructive",
        });
      } else {
        setSubjects(data || []);
      }
    };
    fetchSubjects();
  }, [toast]);

  // Fetch teachers for selected school
  useEffect(() => {
    if (selectedSchool) {
      const fetchTeachers = async () => {
        const { data, error } = await supabase
          .from("teachers")
          .select("id, name")
          .eq("school_id", parseInt(selectedSchool));
        
        if (error) {
          toast({
            title: "加载失败",
            description: "无法加载教师信息",
            variant: "destructive",
          });
        } else {
          setTeachers(data || []);
        }
      };
      fetchTeachers();
    }
  }, [selectedSchool, toast]);

  // Fetch classes and their teacher assignments
  useEffect(() => {
    if (selectedAcademicYear && selectedSchool) {
      fetchClasses();
    }
  }, [selectedAcademicYear, selectedSchool, selectedGrade]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("classes")
        .select("id, name, grade_level, homeroom_teacher_id")
        .eq("school_id", parseInt(selectedSchool));

      if (selectedGrade && selectedGrade !== "all") {
        query = query.eq("grade_level", selectedGrade);
      }

      const { data: classesData, error } = await query;
      if (error) throw error;

      // Fetch course assignments and homeroom teachers for each class
      const classesWithAssignments = await Promise.all(
        (classesData || []).map(async (cls) => {
          // Get homeroom teacher name by checking all teachers and their assignments
          const homeroomTeacher = teachers.find(t => t.id === (cls as any).homeroom_teacher_id);
          
          // Get course assignments
          const { data: assignments } = await supabase
            .from("course_assignments")
            .select(`
              subject_id,
              teachers(name)
            `)
            .eq("class_id", cls.id)
            .eq("academic_year", selectedAcademicYear);

          const course_assignments = subjects.map((subject) => {
            const assignment = assignments?.find((a) => a.subject_id === subject.id);
            return {
              subject_id: subject.id,
              teacher_name: (assignment as any)?.teachers?.name || "",
            };
          });

          return {
            ...cls,
            homeroom_teacher_name: homeroomTeacher?.name || "",
            course_assignments,
          };
        })
      );

      setClasses(classesWithAssignments);
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法加载班级信息",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAndSaveHomeroom = async (classId: number, teacherName: string) => {
    try {
      if (!teacherName.trim()) {
        toast({
          title: "提示",
          description: "班主任姓名不能为空",
          variant: "destructive",
        });
        return;
      }

      // Check if teacher exists
      const teacher = teachers.find(t => t.name === teacherName.trim());

      if (!teacher) {
        toast({
          title: "保存失败",
          description: "数据库中不存在此教师名称，请联系系统管理员",
          variant: "destructive",
        });
        return;
      }

      // Use the update_homeroom_teacher function
      const { error } = await supabase.rpc('update_homeroom_teacher', {
        class_id: classId,
        teacher_id: teacher.id
      });

      if (error) throw error;

      toast({
        title: "保存成功",
        description: `班主任已设置为 ${teacherName}`,
      });
      fetchClasses();
    } catch (error) {
      toast({
        title: "保存失败",
        description: "无法保存班主任信息",
        variant: "destructive",
      });
    }
  };

  const validateAndSaveCourseAssignment = async (classId: number, subjectId: number, teacherName: string) => {
    try {
      if (!teacherName.trim()) {
        // Remove course assignment
        const { error } = await supabase
          .from("course_assignments")
          .delete()
          .eq("class_id", classId)
          .eq("subject_id", subjectId)
          .eq("academic_year", selectedAcademicYear);

        if (error) throw error;

        const subject = subjects.find(s => s.id === subjectId);
        toast({
          title: "保存成功",
          description: `${subject?.name}任课老师已清空`,
        });
        fetchClasses();
        return;
      }

      // Check if teacher exists
      const teacher = teachers.find(t => t.name === teacherName.trim());

      if (!teacher) {
        toast({
          title: "保存失败",
          description: "数据库中不存在此教师名称，请联系系统管理员",
          variant: "destructive",
        });
        return;
      }

      // Upsert course assignment
      const { error } = await supabase
        .from("course_assignments")
        .upsert({
          teacher_id: teacher.id,
          class_id: classId,
          subject_id: subjectId,
          academic_year: selectedAcademicYear,
        }, {
          onConflict: "class_id,subject_id,academic_year"
        });

      if (error) throw error;

      const subject = subjects.find(s => s.id === subjectId);
      toast({
        title: "保存成功",
        description: `${subject?.name}任课老师已设置为 ${teacherName}`,
      });
      fetchClasses();
    } catch (error) {
      toast({
        title: "保存失败",
        description: "无法保存任课老师信息",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-primary">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">教师数据维护</h1>
              <p className="text-muted-foreground text-lg">管理班主任和任课老师分配</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0 gradient-soft">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              筛选条件
            </CardTitle>
            <CardDescription className="text-base">选择学年、学校和年级来查看班级信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="academic-year" className="text-sm font-semibold">学年 *</Label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger className="h-12">
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

              <div className="space-y-3">
                <Label htmlFor="school" className="text-sm font-semibold">学校 *</Label>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="选择学校" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="grade" className="text-sm font-semibold">年级</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="选择年级（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Cards */}
        {selectedAcademicYear && selectedSchool && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground text-lg">加载中...</p>
                </div>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <School className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">没有找到班级信息</p>
                <p className="text-muted-foreground/70 text-sm">请检查筛选条件或联系管理员</p>
              </div>
            ) : (
              sortedClasses.map((classData) => {
                const isCollapsed = collapsedClasses.has(classData.id);
                return (
                  <Collapsible key={classData.id} open={!isCollapsed} onOpenChange={() => toggleClassCollapse(classData.id)}>
                    <Card className="card-hover shadow-lg border-0">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-accent-soft">
                                <School className="h-6 w-6 text-accent" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold">{classData.grade_level} - {classData.name}</div>
                                <div className="text-sm text-muted-foreground font-normal">
                                  班级 ID: {classData.id} | 学年: {selectedAcademicYear}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="p-2">
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Homeroom Teacher */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <UserCheck className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">班主任</h3>
                              </div>
                              <div className="space-y-3">
                                <Label htmlFor={`homeroom-${classData.id}`} className="text-sm font-medium">教师姓名</Label>
                                <Input
                                  id={`homeroom-${classData.id}`}
                                  defaultValue={classData.homeroom_teacher_name || ""}
                                  placeholder="输入班主任姓名"
                                  className="h-12 transition-smooth focus:ring-2 focus:ring-primary/20"
                                  onBlur={(e) => {
                                    if (e.target.value !== (classData.homeroom_teacher_name || "")) {
                                      validateAndSaveHomeroom(classData.id, e.target.value);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                />
                                <p className="text-xs text-muted-foreground">输入完成后按回车或点击其他区域保存</p>
                              </div>
                            </div>

                            {/* Subject Teachers */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-accent/10">
                                  <BookOpen className="h-5 w-5 text-accent" />
                                </div>
                                <h3 className="text-lg font-semibold">任课老师</h3>
                              </div>
                              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {subjects.map((subject) => {
                                  const assignment = classData.course_assignments.find(
                                    (a) => a.subject_id === subject.id
                                  );
                                  return (
                                    <div key={subject.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                                      <div className="w-20 text-sm font-medium text-muted-foreground shrink-0">
                                        {subject.name}
                                      </div>
                                      <div className="flex-1">
                                        <Input
                                          defaultValue={assignment?.teacher_name || ""}
                                          placeholder="输入教师姓名"
                                          className="h-10 transition-smooth focus:ring-2 focus:ring-accent/20"
                                          onBlur={(e) => {
                                            if (e.target.value !== (assignment?.teacher_name || "")) {
                                              validateAndSaveCourseAssignment(
                                                classData.id,
                                                subject.id,
                                                e.target.value
                                              );
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.currentTarget.blur();
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">输入完成后按回车或点击其他区域保存</p>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </div>
        )}

        {selectedAcademicYear && selectedSchool && sortedClasses.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              共找到 <span className="font-semibold text-primary">{sortedClasses.length}</span> 个班级
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMaintenance;