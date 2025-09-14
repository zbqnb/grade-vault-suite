-- Create function to update homeroom teacher
CREATE OR REPLACE FUNCTION public.update_homeroom_teacher(class_id bigint, teacher_id bigint DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.classes 
    SET homeroom_teacher_id = teacher_id 
    WHERE id = class_id;
END;
$$;