import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cruqcglooudetpxstvsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydXFjZ2xvb3VkZXRweHN0dnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTAyMjQsImV4cCI6MjA4OTM2NjIyNH0.ZqV49eayg6J-rk2yC5QKHMQ2XWEG24ALdB9UAbuTOIc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
