import { useState, useEffect } from "react";
import { Users, School, BookOpen, UserCheck, Search, Save, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  grade_level: string;
  homeroom_teacher_id?: number;
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
  const [loading, setLoading] = useState(false);

  const academicYears = ["2024-2025", "2025-2026", "2026-2027"];
  const gradeOptions = ["初中一年级", "初中二年级", "初中三年级", "高中一年级", "高中二年级", "高中三年级"];

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
        .select(`
          id,
          name,
          grade_level,
          academic_year
        `)
        .eq("school_id", parseInt(selectedSchool));

      if (selectedGrade) {
        query = query.eq("grade_level", selectedGrade);
      }

      const { data: classesData, error } = await query;

      if (error) throw error;

      // Fetch course assignments and homeroom teachers for each class
      const classesWithAssignments = await Promise.all(
        (classesData || []).map(async (cls) => {
          // Get homeroom teacher info
          const { data: homeroomTeacher } = await supabase
            .from("teachers")
            .select("name")
            .eq("id", (cls as any).homeroom_teacher_id)
            .single();

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
            homeroom_teacher_id: (cls as any).homeroom_teacher_id,
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
    if (!teacherName.trim()) {
      // Clear homeroom teacher
      const { error } = await supabase.rpc('update_homeroom_teacher', {
        class_id: classId,
        teacher_id: null
      });

      if (error) {
        toast({
          title: "保存失败",
          description: "无法清空班主任信息",
          variant: "destructive",
        });
      } else {
        toast({
          title: "保存成功",
          description: "班主任信息已清空",
        });
        fetchClasses();
      }
      return;
    }

    // Check if teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("name", teacherName.trim())
      .eq("school_id", parseInt(selectedSchool))
      .single();

    if (teacherError || !teacher) {
      toast({
        title: "保存失败",
        description: "数据库中不存在此教师名称，请联系系统管理员",
        variant: "destructive",
      });
      return;
    }

    // Update homeroom teacher - using raw SQL update since homeroom_teacher_id isn't in types
    const { error } = await supabase.rpc('update_homeroom_teacher', {
      class_id: classId,
      teacher_id: teacher.id
    });

    if (error) {
      toast({
        title: "保存失败",
        description: "无法保存班主任信息",
        variant: "destructive",
      });
    } else {
      toast({
        title: "保存成功",
        description: `班主任已设置为 ${teacherName}`,
      });
      fetchClasses();
    }
  };

  const validateAndSaveCourseAssignment = async (classId: number, subjectId: number, teacherName: string) => {
    if (!teacherName.trim()) {
      // Remove course assignment
      const { error } = await supabase
        .from("course_assignments")
        .delete()
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .eq("academic_year", selectedAcademicYear);

      if (error) {
        toast({
          title: "保存失败",
          description: "无法删除任课老师信息",
          variant: "destructive",
        });
      } else {
        const subject = subjects.find(s => s.id === subjectId);
        toast({
          title: "保存成功",
          description: `${subject?.name}任课老师已清空`,
        });
        fetchClasses();
      }
      return;
    }

    // Check if teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("name", teacherName.trim())
      .eq("school_id", parseInt(selectedSchool))
      .single();

    if (teacherError || !teacher) {
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
        onConflict: "teacher_id,class_id,subject_id,academic_year"
      });

    if (error) {
      toast({
        title: "保存失败",
        description: "无法保存任课老师信息",
        variant: "destructive",
      });
    } else {
      const subject = subjects.find(s => s.id === subjectId);
      toast({
        title: "保存成功",
        description: `${subject?.name}任课老师已设置为 ${teacherName}`,
      });
      fetchClasses();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-soft">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">教师数据维护</h1>
              <p className="text-muted-foreground">管理班主任和任课老师分配</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              筛选条件
            </CardTitle>
            <CardDescription>选择学年、学校和年级来查看班级信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academic-year">学年 *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="school">学校 *</Label>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="grade">年级</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部年级</SelectItem>
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">没有找到班级信息</p>
              </div>
            ) : (
              classes.map((classData) => (
                <Card key={classData.id} className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent-soft">
                        <School className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-xl">{classData.grade_level} - {classData.name}</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          班级 ID: {classData.id}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Homeroom Teacher */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">班主任</h3>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`homeroom-${classData.id}`}>教师姓名</Label>
                          <Input
                            id={`homeroom-${classData.id}`}
                            defaultValue={classData.homeroom_teacher_name}
                            placeholder="输入班主任姓名"
                            onBlur={(e) => {
                              if (e.target.value !== classData.homeroom_teacher_name) {
                                validateAndSaveHomeroom(classData.id, e.target.value);
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

                      {/* Subject Teachers */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-accent" />
                          <h3 className="text-lg font-semibold">任课老师</h3>
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {subjects.map((subject) => {
                            const assignment = classData.course_assignments.find(
                              (a) => a.subject_id === subject.id
                            );
                            return (
                              <div key={subject.id} className="flex items-center gap-3">
                                <div className="w-16 text-sm font-medium text-muted-foreground">
                                  {subject.name}
                                </div>
                                <div className="flex-1">
                                  <Input
                                    defaultValue={assignment?.teacher_name || ""}
                                    placeholder="输入教师姓名"
                                    className="w-full"
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMaintenance;