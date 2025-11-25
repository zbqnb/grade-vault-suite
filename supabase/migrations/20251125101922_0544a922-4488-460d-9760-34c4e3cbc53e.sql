-- 创建动态一分一段分析函数
CREATE OR REPLACE FUNCTION get_dynamic_score_distribution(
  p_assessment_id BIGINT,
  p_subject_id BIGINT
)
RETURNS TABLE (
  group_name TEXT,
  group_type TEXT,
  score_range TEXT,
  min_score INT,
  max_score INT,
  student_count BIGINT,
  percentage DECIMAL,
  group_subtotal BIGINT,
  group_subtotal_percentage DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_score INT;
  v_excellent_threshold INT;
  v_pass_threshold INT;
  v_poor_threshold INT;
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

  -- 获取总学生数
  SELECT COUNT(*)
  INTO v_total_students
  FROM individual_scores
  WHERE assessment_id = p_assessment_id 
    AND subject_id = p_subject_id
    AND score_value IS NOT NULL;

  -- 如果没有学生，直接返回空
  IF v_total_students = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH score_segments AS (
    -- 优秀段：每1分统计
    SELECT 
      '优秀段' as group_name,
      'excellent' as group_type,
      CAST(FLOOR(score_value) AS INT) as min_score,
      CAST(FLOOR(score_value) AS INT) as max_score,
      COUNT(*) as student_count
    FROM individual_scores
    WHERE assessment_id = p_assessment_id 
      AND subject_id = p_subject_id
      AND score_value >= v_excellent_threshold
      AND score_value IS NOT NULL
    GROUP BY FLOOR(score_value)

    UNION ALL

    -- 良好段：每5分统计
    SELECT 
      '良好段' as group_name,
      'good' as group_type,
      CAST(FLOOR(score_value / 5) * 5 AS INT) as min_score,
      CAST(FLOOR(score_value / 5) * 5 + 4 AS INT) as max_score,
      COUNT(*) as student_count
    FROM individual_scores
    WHERE assessment_id = p_assessment_id 
      AND subject_id = p_subject_id
      AND score_value >= v_pass_threshold
      AND score_value < v_excellent_threshold
      AND score_value IS NOT NULL
    GROUP BY FLOOR(score_value / 5)

    UNION ALL

    -- 及格段：每5分统计
    SELECT 
      '及格段' as group_name,
      'pass' as group_type,
      CAST(FLOOR(score_value / 5) * 5 AS INT) as min_score,
      CAST(FLOOR(score_value / 5) * 5 + 4 AS INT) as max_score,
      COUNT(*) as student_count
    FROM individual_scores
    WHERE assessment_id = p_assessment_id 
      AND subject_id = p_subject_id
      AND score_value >= v_poor_threshold
      AND score_value < v_pass_threshold
      AND score_value IS NOT NULL
    GROUP BY FLOOR(score_value / 5)

    UNION ALL

    -- 差生段：全部归为一个分段
    SELECT 
      '差生段' as group_name,
      'poor' as group_type,
      0 as min_score,
      v_poor_threshold - 1 as max_score,
      COUNT(*) as student_count
    FROM individual_scores
    WHERE assessment_id = p_assessment_id 
      AND subject_id = p_subject_id
      AND score_value < v_poor_threshold
      AND score_value IS NOT NULL
  ),
  group_totals AS (
    SELECT 
      group_name,
      group_type,
      SUM(student_count) as subtotal,
      ROUND(SUM(student_count)::DECIMAL / v_total_students * 100, 2) as subtotal_percentage
    FROM score_segments
    GROUP BY group_name, group_type
  )
  SELECT 
    ss.group_name,
    ss.group_type,
    CASE 
      WHEN ss.min_score = ss.max_score THEN ss.min_score || '分'
      ELSE ss.min_score || '-' || ss.max_score || '分'
    END as score_range,
    ss.min_score,
    ss.max_score,
    ss.student_count,
    ROUND(ss.student_count::DECIMAL / v_total_students * 100, 2) as percentage,
    gt.subtotal as group_subtotal,
    gt.subtotal_percentage as group_subtotal_percentage
  FROM score_segments ss
  JOIN group_totals gt ON ss.group_name = gt.group_name
  WHERE ss.student_count > 0
  ORDER BY 
    CASE ss.group_type
      WHEN 'excellent' THEN 1
      WHEN 'good' THEN 2
      WHEN 'pass' THEN 3
      WHEN 'poor' THEN 4
    END,
    ss.min_score DESC;
END;
$$;