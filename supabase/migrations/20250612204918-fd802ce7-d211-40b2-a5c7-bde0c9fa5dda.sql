
-- Create sites table
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  supervisor TEXT,
  manager TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_products table
CREATE TABLE public.inventory_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  rate_per_unit DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_material_usage table
CREATE TABLE public.site_material_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  quantity_used INTEGER NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_tasks table
CREATE TABLE public.site_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (you can modify these later for user-specific access)
CREATE POLICY "Allow all operations on sites" ON public.sites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_products" ON public.inventory_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on site_material_usage" ON public.site_material_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on site_tasks" ON public.site_tasks FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample data
INSERT INTO public.sites (name, location, start_date, end_date, supervisor, manager) VALUES
('Downtown Office Renovation', '123 Main St, Downtown', '2024-01-15', '2024-04-15', 'John Smith', 'Sarah Johnson'),
('Residential Villa Project', '456 Oak Ave, Suburbs', '2024-02-01', '2024-06-30', 'Mike Davis', 'Lisa Brown'),
('Hotel Lobby Redesign', '789 Business Blvd', '2024-03-01', NULL, 'Tom Wilson', 'Sarah Johnson');

INSERT INTO public.inventory_products (name, unit, rate_per_unit, stock_quantity, low_stock_threshold) VALUES
('Ceramic Tiles', 'sq ft', 12.50, 500, 50),
('Paint (Premium)', 'gallon', 45.00, 25, 5),
('Hardwood Flooring', 'sq ft', 28.00, 200, 20),
('LED Light Fixtures', 'piece', 85.00, 15, 3),
('Carpet (Premium)', 'sq yard', 35.00, 100, 10),
('Wallpaper Rolls', 'roll', 25.00, 30, 5);

INSERT INTO public.site_material_usage (site_id, product_id, quantity_used, usage_date, notes) VALUES
((SELECT id FROM public.sites WHERE name = 'Downtown Office Renovation'), 
 (SELECT id FROM public.inventory_products WHERE name = 'Ceramic Tiles'), 
 100, '2024-01-20', 'Bathroom flooring'),
((SELECT id FROM public.sites WHERE name = 'Downtown Office Renovation'), 
 (SELECT id FROM public.inventory_products WHERE name = 'Paint (Premium)'), 
 5, '2024-01-25', 'Office walls - first coat');
