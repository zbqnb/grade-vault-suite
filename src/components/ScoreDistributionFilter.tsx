import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: number;
  name: string;
}

interface Assessment {
  id: number;
  academic_year: string;
  month: number;
  type: string;
  grade_level: string;
}

interface Subject {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

interface ScoreDistributionFilterProps {
  onQuery: (filters: {
    schoolId: number;
    assessmentId: number;
    subjectIds: number[];
    sortOption: string;
    classId?: number;
  }) => void;
}

export const ScoreDistributionFilter = ({ onQuery }: ScoreDistributionFilterProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [sortOption, setSortOption] = useState<string>('avgDesc');

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name')
          .order('name');

        if (error) throw error;

        setSchools(data || []);
        if (data && data.length > 0) {
          setSelectedSchool(data[0].id);
        }
      } catch (error) {
        console.error('加载学校失败:', error);
        toast({
          title: "加载失败",
          description: "无法加载学校列表",
          variant: "destructive"
        });
      }
    };

    const loadSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .order('id');

        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        console.error('加载科目失败:', error);
        toast({
          title: "加载失败",
          description: "无法加载科目列表",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSchools();
    loadSubjects();
  }, [toast]);

  useEffect(() => {
    if (!selectedSchool) return;

    const loadAssessments = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('id, academic_year, month, type, grade_level')
          .eq('school_id', selectedSchool)
          .order('academic_year', { ascending: false })
          .order('month', { ascending: false });

        if (error) throw error;

        setAssessments(data || []);
        setSelectedAssessment(null);
        setSelectedSubjects(new Set());
      } catch (error) {
        console.error('加载考试失败:', error);
        toast({
          title: "加载失败",
          description: "无法加载考试列表",
          variant: "destructive"
        });
      }
    };

    const loadClasses = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('id, name')
          .eq('school_id', selectedSchool)
          .order('name');

        if (error) throw error;
        setClasses(data || []);
        setSelectedClass(0);
      } catch (error) {
        console.error('加载班级失败:', error);
        toast({
          title: "加载失败",
          description: "无法加载班级列表",
          variant: "destructive"
        });
      }
    };

    loadAssessments();
    loadClasses();
  }, [selectedSchool, toast]);

  const handleSubjectToggle = (subjectId: number) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const toggleAllSubjects = () => {
    if (selectedSubjects.size === subjects.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(subjects.map(s => s.id)));
    }
  };

  const handleQuery = () => {
    if (!selectedSchool || !selectedAssessment) {
      toast({
        title: "请选择",
        description: "请选择学校和考试",
        variant: "destructive"
      });
      return;
    }

    if (selectedSubjects.size === 0) {
      toast({
        title: "请选择科目",
        description: "请至少选择一个科目",
        variant: "destructive"
      });
      return;
    }

    onQuery({
      schoolId: selectedSchool,
      assessmentId: selectedAssessment,
      subjectIds: Array.from(selectedSubjects),
      sortOption,
      classId: selectedClass || undefined
    });
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-muted/40">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="h-1 w-8 bg-primary rounded-full" />
          筛选条件
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* School */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">学校</Label>
            <Select 
              value={selectedSchool?.toString()} 
              onValueChange={(v) => setSelectedSchool(Number(v))}
            >
              <SelectTrigger className="hover:border-primary/50 transition-colors">
                <SelectValue placeholder="选择学校" />
              </SelectTrigger>
              <SelectContent>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assessment */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">考试</Label>
            <Select 
              value={selectedAssessment?.toString()} 
              onValueChange={(v) => setSelectedAssessment(Number(v))}
              disabled={!selectedSchool}
            >
              <SelectTrigger className="hover:border-primary/50 transition-colors">
                <SelectValue placeholder="选择考试" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map(assessment => (
                  <SelectItem key={assessment.id} value={assessment.id.toString()}>
                    {assessment.academic_year} - {assessment.month}月 - {assessment.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">班级</Label>
            <Select
              value={selectedClass.toString()}
              onValueChange={(value) => setSelectedClass(Number(value))}
              disabled={!selectedSchool}
            >
              <SelectTrigger className="hover:border-primary/50 transition-colors">
                <SelectValue placeholder="选择班级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">全部班级</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Option */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">排序方式</Label>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="hover:border-primary/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avgDesc">按平均分降序</SelectItem>
                <SelectItem value="excellenceDesc">按优秀率降序</SelectItem>
                <SelectItem value="passDesc">按及格率降序</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subjects */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">科目</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllSubjects}
                className="h-auto p-1 text-xs text-primary hover:bg-primary/10"
              >
                {selectedSubjects.size === subjects.length ? '取消' : '全选'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-muted/30">
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center space-x-2 hover:bg-muted/50 p-1 rounded transition-colors">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={selectedSubjects.has(subject.id)}
                    onCheckedChange={() => handleSubjectToggle(subject.id)}
                  />
                  <Label 
                    htmlFor={`subject-${subject.id}`}
                    className="cursor-pointer text-sm"
                  >
                    {subject.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Query Button */}
        <div className="mt-6">
          <Button 
            onClick={handleQuery} 
            className="w-full md:w-auto px-8 shadow-md hover:shadow-lg transition-all"
          >
            查询
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};