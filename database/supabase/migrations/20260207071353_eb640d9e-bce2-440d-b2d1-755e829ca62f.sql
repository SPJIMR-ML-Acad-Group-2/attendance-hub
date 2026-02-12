
-- Role enum
CREATE TYPE public.app_role AS ENUM ('student', 'program_office');

-- User roles table (per security requirement: roles in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  student_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Divisions
CREATE TABLE public.divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Attendance records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id, session_date)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Upload logs
CREATE TABLE public.upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  rows_processed INT NOT NULL DEFAULT 0,
  rows_failed INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.upload_logs ENABLE ROW LEVEL SECURITY;

-- Security definer helper: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get student_id for a user
CREATE OR REPLACE FUNCTION public.get_student_id_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies

-- user_roles: users can read own, program_office can read all
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'program_office')
);
CREATE POLICY "Program office manages roles" ON public.user_roles FOR ALL USING (
  public.has_role(auth.uid(), 'program_office')
);

-- profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'program_office')
);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- divisions: program office full, students read
CREATE POLICY "Anyone authenticated reads divisions" ON public.divisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Program office manages divisions" ON public.divisions FOR ALL USING (public.has_role(auth.uid(), 'program_office'));

-- courses: program office full, students read
CREATE POLICY "Anyone authenticated reads courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Program office manages courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'program_office'));

-- students
CREATE POLICY "Students read own record" ON public.students FOR SELECT USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'program_office')
);
CREATE POLICY "Program office manages students" ON public.students FOR ALL USING (
  public.has_role(auth.uid(), 'program_office')
);

-- attendance_records
CREATE POLICY "Students read own attendance" ON public.attendance_records FOR SELECT USING (
  student_id = public.get_student_id_for_user(auth.uid()) OR public.has_role(auth.uid(), 'program_office')
);
CREATE POLICY "Program office manages attendance" ON public.attendance_records FOR ALL USING (
  public.has_role(auth.uid(), 'program_office')
);

-- upload_logs
CREATE POLICY "Program office reads upload logs" ON public.upload_logs FOR SELECT USING (
  public.has_role(auth.uid(), 'program_office')
);
CREATE POLICY "Program office inserts upload logs" ON public.upload_logs FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'program_office')
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (COALESCE(NEW.raw_user_meta_data->>'role', 'student'))::app_role);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
