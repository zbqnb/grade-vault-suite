-- 修复函数的 search_path 安全问题
CREATE OR REPLACE FUNCTION public.get_school_subject_averages(target_assessment_ids bigint[])
RETURNS TABLE(
    school_name text,
    subject_name text,
    average_score numeric,
    rank_in_subject bigint,
    total_schools bigint,
    grade_average numeric
)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    WITH RelevantScores AS (
        SELECT
            s.id AS school_id,
            s.name AS school,
            sub.name AS subject,
            sc.score_value
        FROM
            individual_scores sc
        JOIN students stu ON sc.student_id = stu.id
        JOIN classes cls ON stu.class_id = cls.id
        JOIN schools s ON cls.school_id = s.id
        JOIN subjects sub ON sc.subject_id = sub.id
        WHERE
            sc.assessment_id = ANY(target_assessment_ids)
            AND sc.score_value IS NOT NULL
    ),
    SchoolAverages AS (
        SELECT
            rs.school_id,
            rs.school,
            rs.subject,
            ROUND(AVG(rs.score_value), 2) AS avg_score
        FROM
            RelevantScores rs
        GROUP BY
            rs.school_id,
            rs.school,
            rs.subject
    ),
    SubjectGradeAverages AS (
        SELECT
            subject,
            ROUND(AVG(score_value), 2) AS grade_avg
        FROM
            RelevantScores
        GROUP BY
            subject
    ),
    SchoolCounts AS (
        SELECT
            subject,
            COUNT(DISTINCT school_id) AS school_count
        FROM
            SchoolAverages
        GROUP BY
            subject
    )
    SELECT
        sa.school,
        sa.subject,
        sa.avg_score,
        RANK() OVER (PARTITION BY sa.subject ORDER BY sa.avg_score DESC) AS rank_in_subject,
        sc.school_count,
        sga.grade_avg
    FROM
        SchoolAverages sa
    JOIN SubjectGradeAverages sga ON sa.subject = sga.subject
    JOIN SchoolCounts sc ON sa.subject = sc.subject
    ORDER BY
        sa.school,
        CASE sa.subject
            WHEN '语文' THEN 1
            WHEN '数学' THEN 2
            WHEN '英语' THEN 3
            WHEN '物理' THEN 4
            WHEN '化学' THEN 5
            WHEN '历史' THEN 6
            WHEN '地理' THEN 7
            WHEN '政治' THEN 8
            WHEN '生物' THEN 9
            ELSE 99
        END;
END;
$function$;