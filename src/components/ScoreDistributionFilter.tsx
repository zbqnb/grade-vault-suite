import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

  const getSubjectNameById = (id: number) => {
    return subjects.find(s => s.id === id)?.name || '';
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

          {/* Subjects - Combobox */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-muted-foreground">科目</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between hover:border-primary/50 transition-colors",
                    selectedSubjects.size === 0 && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    {selectedSubjects.size === 0
                      ? "选择科目..."
                      : `已选择 ${selectedSubjects.size} 个科目`}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 bg-background z-50" align="start">
                <Command className="bg-background">
                  <CommandInput placeholder="搜索科目..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>未找到科目</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={toggleAllSubjects}
                        className="cursor-pointer"
                      >
                        <div className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedSubjects.size === subjects.length
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}>
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="font-medium">全选/取消全选</span>
                      </CommandItem>
                      {subjects.map((subject) => (
                        <CommandItem
                          key={subject.id}
                          onSelect={() => handleSubjectToggle(subject.id)}
                          className="cursor-pointer"
                        >
                          <div className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedSubjects.has(subject.id)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}>
                            <Check className="h-4 w-4" />
                          </div>
                          {subject.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedSubjects.size > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Array.from(selectedSubjects).map((subjectId) => (
                  <Badge
                    key={subjectId}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleSubjectToggle(subjectId)}
                  >
                    {getSubjectNameById(subjectId)}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
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