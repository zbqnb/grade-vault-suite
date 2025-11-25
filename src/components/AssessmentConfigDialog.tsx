import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Subject {
  id: number;
  name: string;
}

interface ConfigData {
  full_score: number;
  excellent_threshold: number;
  pass_threshold: number;
  poor_threshold: number;
}

interface AssessmentConfigDialogProps {
  open: boolean;
  assessmentId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssessmentConfigDialog = ({ open, assessmentId, onClose, onSuccess }: AssessmentConfigDialogProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<{ [subjectId: number]: ConfigData }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSubjects();
    }
  }, [open]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('id');

      if (error) throw error;

      setSubjects(data || []);

      // 初始化默认配置值
      const defaultConfigs: { [key: number]: ConfigData } = {};
      data?.forEach(subject => {
        defaultConfigs[subject.id] = {
          full_score: 100,
          excellent_threshold: 85,
          pass_threshold: 60,
          poor_threshold: 30,
        };
      });
      setConfigs(defaultConfigs);
    } catch (error) {
      console.error('加载科目失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载科目列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (subjectId: number, field: keyof ConfigData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setConfigs(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: numValue,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upsertData = subjects.map(subject => ({
        assessment_id: assessmentId,
        subject_id: subject.id,
        full_score: configs[subject.id].full_score,
        excellent_threshold: configs[subject.id].excellent_threshold,
        pass_threshold: configs[subject.id].pass_threshold,
        poor_threshold: configs[subject.id].poor_threshold,
      }));

      const { error } = await supabase
        .from('assessment_subjects')
        .upsert(upsertData, { onConflict: 'assessment_id,subject_id' });

      if (error) throw error;

      toast({
        title: "保存成功",
        description: "考试配置已保存",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('保存配置失败:', error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存失败",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>考试配置</DialogTitle>
          <DialogDescription>
            请完善本次考试的满分、优秀率等信息
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map(subject => (
              <Card key={subject.id}>
                <CardContent className="pt-6">
                  <h3 className="font-medium text-lg mb-4">{subject.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`full_score_${subject.id}`}>满分</Label>
                      <Input
                        id={`full_score_${subject.id}`}
                        type="number"
                        value={configs[subject.id]?.full_score || 100}
                        onChange={(e) => handleConfigChange(subject.id, 'full_score', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`excellent_${subject.id}`}>优秀分数线</Label>
                      <Input
                        id={`excellent_${subject.id}`}
                        type="number"
                        value={configs[subject.id]?.excellent_threshold || 85}
                        onChange={(e) => handleConfigChange(subject.id, 'excellent_threshold', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pass_${subject.id}`}>及格分数线</Label>
                      <Input
                        id={`pass_${subject.id}`}
                        type="number"
                        value={configs[subject.id]?.pass_threshold || 60}
                        onChange={(e) => handleConfigChange(subject.id, 'pass_threshold', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`poor_${subject.id}`}>差生分数线</Label>
                      <Input
                        id={`poor_${subject.id}`}
                        type="number"
                        value={configs[subject.id]?.poor_threshold || 30}
                        onChange={(e) => handleConfigChange(subject.id, 'poor_threshold', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? "保存中..." : "保存配置"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
