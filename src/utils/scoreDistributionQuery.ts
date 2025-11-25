import { supabase } from "@/integrations/supabase/client";

export interface SegmentData {
  groupName: string;
  groupType: 'excellent' | 'good' | 'pass' | 'poor';
  scoreRange: string;
  minScore: number;
  maxScore: number;
  studentCount: number;
  percentage: number;
  groupSubtotal: number;
  groupSubtotalPercentage: number;
}

export interface SegmentGroup {
  groupName: string;
  groupType: 'excellent' | 'good' | 'pass' | 'poor';
  segments: {
    label: string;
    minScore: number;
    maxScore: number;
    studentCount: number;
    percentage: number;
  }[];
  subtotal: number;
  subtotalPercentage: number;
}

export interface DistributionData {
  subjectId: number;
  subjectName: string;
  averageScore: number;
  passRate: number;
  excellenceRate: number;
  poorRate: number;
  segmentGroups: SegmentGroup[];
}

/**
 * 调用数据库函数获取一分一段数据
 */
export const getScoreDistribution = async (
  assessmentId: number,
  subjectId: number
): Promise<SegmentData[]> => {
  const { data, error } = await supabase.rpc('get_dynamic_score_distribution', {
    p_assessment_id: assessmentId,
    p_subject_id: subjectId
  });

  if (error) {
    console.error('获取分段数据失败:', error);
    throw error;
  }

  return (data || []).map(row => ({
    groupName: row.group_name,
    groupType: row.group_type as 'excellent' | 'good' | 'pass' | 'poor',
    scoreRange: row.score_range,
    minScore: row.min_score,
    maxScore: row.max_score,
    studentCount: row.student_count,
    percentage: row.percentage,
    groupSubtotal: row.group_subtotal,
    groupSubtotalPercentage: row.group_subtotal_percentage
  }));
};

/**
 * 将分段数据按分段组分组
 */
export const groupSegments = (segments: SegmentData[]): SegmentGroup[] => {
  const groups = new Map<string, SegmentGroup>();

  segments.forEach(segment => {
    if (!groups.has(segment.groupName)) {
      groups.set(segment.groupName, {
        groupName: segment.groupName,
        groupType: segment.groupType,
        segments: [],
        subtotal: segment.groupSubtotal,
        subtotalPercentage: segment.groupSubtotalPercentage
      });
    }

    groups.get(segment.groupName)!.segments.push({
      label: segment.scoreRange,
      minScore: segment.minScore,
      maxScore: segment.maxScore,
      studentCount: segment.studentCount,
      percentage: segment.percentage
    });
  });

  // 按顺序排列：优秀 -> 良好 -> 及格 -> 差生
  const order = { excellent: 1, good: 2, pass: 3, poor: 4 };
  return Array.from(groups.values()).sort(
    (a, b) => order[a.groupType] - order[b.groupType]
  );
};

/**
 * 计算科目的统计数据
 */
export const calculateSubjectStats = async (
  assessmentId: number,
  subjectId: number
): Promise<{
  averageScore: number;
  passRate: number;
  excellenceRate: number;
  poorRate: number;
}> => {
  // 获取该科目的分数线配置
  const { data: config } = await supabase
    .from('assessment_subjects')
    .select('excellent_threshold, pass_threshold, poor_threshold')
    .eq('assessment_id', assessmentId)
    .eq('subject_id', subjectId)
    .single();

  const excellentThreshold = config?.excellent_threshold || 85;
  const passThreshold = config?.pass_threshold || 60;
  const poorThreshold = config?.poor_threshold || 30;

  // 获取所有成绩
  const { data: scores } = await supabase
    .from('individual_scores')
    .select('score_value')
    .eq('assessment_id', assessmentId)
    .eq('subject_id', subjectId)
    .not('score_value', 'is', null);

  if (!scores || scores.length === 0) {
    return {
      averageScore: 0,
      passRate: 0,
      excellenceRate: 0,
      poorRate: 0
    };
  }

  const totalStudents = scores.length;
  const sum = scores.reduce((acc, s) => acc + (s.score_value || 0), 0);
  const averageScore = sum / totalStudents;

  const excellentCount = scores.filter(s => (s.score_value || 0) >= excellentThreshold).length;
  const passCount = scores.filter(s => (s.score_value || 0) >= passThreshold).length;
  const poorCount = scores.filter(s => (s.score_value || 0) < poorThreshold).length;

  return {
    averageScore: Math.round(averageScore * 100) / 100,
    passRate: Math.round((passCount / totalStudents) * 10000) / 100,
    excellenceRate: Math.round((excellentCount / totalStudents) * 10000) / 100,
    poorRate: Math.round((poorCount / totalStudents) * 10000) / 100
  };
};
