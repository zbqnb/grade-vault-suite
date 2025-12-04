-- 创建一个新函数来计算班级学生总分的平均分
CREATE OR REPLACE FUNCTION public.get_class_total_score_averages(target_assessment_ids bigint[])
RETURNS TABLE(
    school_name text, 
    class_name text, 
    total_score_average numeric, 
    student_count bigint,
    rank_in_grade bigint
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH StudentTotalScores AS (
        -- 计算每个学生的总分
        SELECT
            s.name AS school,
            cls.name AS class,
            stu.id AS student_id,
            SUM(sc.score_value) AS total_score
        FROM
            individual_scores sc
        JOIN students stu ON sc.student_id = stu.id
        JOIN classes cls ON stu.class_id = cls.id
        JOIN schools s ON cls.school_id = s.id
        WHERE
            sc.assessment_id = ANY(target_assessment_ids)
            AND sc.score_value IS NOT NULL
        GROUP BY
            s.name,
            cls.name,
            stu.id
    ),
    ClassAverages AS (
        -- 计算每个班级的学生总分平均
        SELECT
            sts.school,
            sts.class,
            ROUND(AVG(sts.total_score), 2) AS avg_total_score,
            COUNT(DISTINCT sts.student_id) AS student_cnt
        FROM
            StudentTotalScores sts
        GROUP BY
            sts.school,
            sts.class
    )
    SELECT
        ca.school,
        ca.class,
        ca.avg_total_score,
        ca.student_cnt,
        RANK() OVER (ORDER BY ca.avg_total_score DESC) AS class_rank
    FROM
        ClassAverages ca
    ORDER BY
        ca.school,
        CAST(substring(ca.class from '(\d+)') AS INTEGER);
END;
$function$;