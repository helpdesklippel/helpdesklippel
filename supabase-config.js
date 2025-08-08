// supabase-config.js
const supabaseUrl = 'https://izkkozkulgjpejyvcmiw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a2tvemt1bGdqcGVqeXZjbWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODcwNzYsImV4cCI6MjA3MDA2MzA3Nn0.oyLHuA3n3ZlMuHWaMF4OEbSWMmhIYzeIE7LuFJFY7MA';
const { createClient } = window.supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Tornar disponível globalmente
window.supabaseClient = supabaseClient;