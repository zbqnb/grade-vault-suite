-- Add unique constraint to classes table for proper upsert handling
ALTER TABLE public.classes 
ADD CONSTRAINT classes_name_school_id_academic_year_unique 
UNIQUE (name, school_id, academic_year);