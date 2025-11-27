-- 修改 get_dynamic_score_distribution 函数，添加可选的班级筛选参数
CREATE OR REPLACE FUNCTION public.get_dynamic_score_distribution(
  p_assessment_id bigint, 
  p_subject_id bigint,
  p_class_id bigint DEFAULT NULL
)
RETURNS TABLE(
  group_name text, 
  group_type text, 
  score_range text, 
  min_score integer, 
  max_score integer, 
  student_count bigint, 
  percentage numeric, 
  group_subtotal bigint, 
  group_subtotal_percentage numeric
)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_full_score NUMERIC;
  v_excellent_threshold NUMERIC;
  v_pass_threshold NUMERIC;
  v_poor_threshold NUMERIC;
  v_total_students BIGINT;
BEGIN
  -- 获取该考试该科目的分数线配置
  SELECT 
    COALESCE(full_score, 100),
    COALESCE(excellent_threshold, 85),
    COALESCE(pass_threshold, 60),
    COALESCE(poor_threshold, 30)
  INTO 
    v_full_score,
    v_excellent_threshold,
    v_pass_threshold,
    v_poor_threshold
  FROM assessment_subjects
  WHERE assessment_id = p_assessment_id 
    AND subject_id = p_subject_id;

  -- 如果没有配置，使用默认值
  v_full_score := COALESCE(v_full_score, 100);
  v_excellent_threshold := COALESCE(v_excellent_threshold, 85);
  v_pass_threshold := COALESCE(v_pass_threshold, 60);
  v_poor_threshold := COALESCE(v_poor_threshold, 30);

  -- 将百分比转换为实际分数线
  v_excellent_threshold := v_full_score * (v_excellent_threshold / 100);
  v_pass_threshold := v_full_score * (v_pass_threshold / 100);
  v_poor_threshold := v_full_score * (v_poor_threshold / 100);

  -- 获取总学生数（如果指定了班级则只统计该班级）
  SELECT COUNT(*)
  INTO v_total_students
  FROM individual_scores isc
  LEFT JOIN students stu ON isc.student_id = stu.id
  WHERE isc.assessment_id = p_assessment_id 
    AND isc.subject_id = p_subject_id
    AND isc.score_value IS NOT NULL
    AND (p_class_id IS NULL OR stu.class_id = p_class_id);

  -- 如果没有学生，直接返回空
  IF v_total_students = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH score_segments AS (
    -- 优秀段：每1分统计
    SELECT 
      '优秀段' as seg_group_name,
      'excellent' as seg_group_type,
      CAST(FLOOR(isc.score_value) AS INT) as seg_min_score,
      CAST(FLOOR(isc.score_value) AS INT) as seg_max_score,
      COUNT(*) as seg_student_count
    FROM individual_scores isc
    LEFT JOIN students stu ON isc.student_id = stu.id
    WHERE isc.assessment_id = p_assessment_id 
      AND isc.subject_id = p_subject_id
      AND isc.score_value >= v_excellent_threshold
      AND isc.score_value IS NOT NULL
      AND (p_class_id IS NULL OR stu.class_id = p_class_id)
    GROUP BY FLOOR(isc.score_value)

    UNION ALL

    -- 良好段：每5分统计
    SELECT 
      '良好段' as seg_group_name,
      'good' as seg_group_type,
      CAST(FLOOR(isc.score_value / 5) * 5 AS INT) as seg_min_score,
      CAST(FLOOR(isc.score_value / 5) * 5 + 4 AS INT) as seg_max_score,
      COUNT(*) as seg_student_count
    FROM individual_scores isc
    LEFT JOIN students stu ON isc.student_id = stu.id
    WHERE isc.assessment_id = p_assessment_id 
      AND isc.subject_id = p_subject_id
      AND isc.score_value >= v_pass_threshold
      AND isc.score_value < v_excellent_threshold
      AND isc.score_value IS NOT NULL
      AND (p_class_id IS NULL OR stu.class_id = p_class_id)
    GROUP BY FLOOR(isc.score_value / 5)

    UNION ALL

    -- 及格段：每5分统计
    SELECT 
      '及格段' as seg_group_name,
      'pass' as seg_group_type,
      CAST(FLOOR(isc.score_value / 5) * 5 AS INT) as seg_min_score,
      CAST(FLOOR(isc.score_value / 5) * 5 + 4 AS INT) as seg_max_score,
      COUNT(*) as seg_student_count
    FROM individual_scores isc
    LEFT JOIN students stu ON isc.student_id = stu.id
    WHERE isc.assessment_id = p_assessment_id 
      AND isc.subject_id = p_subject_id
      AND isc.score_value >= v_poor_threshold
      AND isc.score_value < v_pass_threshold
      AND isc.score_value IS NOT NULL
      AND (p_class_id IS NULL OR stu.class_id = p_class_id)
    GROUP BY FLOOR(isc.score_value / 5)

    UNION ALL

    -- 差生段：全部归为一个分段
    SELECT 
      '差生段' as seg_group_name,
      'poor' as seg_group_type,
      0 as seg_min_score,
      CAST(FLOOR(v_poor_threshold - 1) AS INT) as seg_max_score,
      COUNT(*) as seg_student_count
    FROM individual_scores isc
    LEFT JOIN students stu ON isc.student_id = stu.id
    WHERE isc.assessment_id = p_assessment_id 
      AND isc.subject_id = p_subject_id
      AND isc.score_value < v_poor_threshold
      AND isc.score_value IS NOT NULL
      AND (p_class_id IS NULL OR stu.class_id = p_class_id)
  ),
  group_totals AS (
    SELECT 
      seg_group_name as gt_group_name,
      seg_group_type as gt_group_type,
      SUM(seg_student_count)::BIGINT as gt_subtotal,
      ROUND(SUM(seg_student_count)::DECIMAL / v_total_students * 100, 2) as gt_subtotal_percentage
    FROM score_segments
    GROUP BY seg_group_name, seg_group_type
  )
  SELECT 
    ss.seg_group_name,
    ss.seg_group_type,
    CASE 
      WHEN ss.seg_min_score = ss.seg_max_score THEN ss.seg_min_score || '分'
      ELSE ss.seg_min_score || '-' || ss.seg_max_score || '分'
    END as score_range,
    ss.seg_min_score,
    ss.seg_max_score,
    ss.seg_student_count,
    ROUND(ss.seg_student_count::DECIMAL / v_total_students * 100, 2) as percentage,
    gt.gt_subtotal as group_subtotal,
    gt.gt_subtotal_percentage as group_subtotal_percentage
  FROM score_segments ss
  JOIN group_totals gt ON ss.seg_group_name = gt.gt_group_name
  WHERE ss.seg_student_count > 0
  ORDER BY 
    CASE ss.seg_group_type
      WHEN 'excellent' THEN 1
      WHEN 'good' THEN 2
      WHEN 'pass' THEN 3
      WHEN 'poor' THEN 4
    END,
    ss.seg_min_score DESC;
END;
$function$;