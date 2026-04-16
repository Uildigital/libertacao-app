import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfbhxrljicgcpzxmmpie.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYmh4cmxqaWNnY3B6eG1tcGllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI5Nzg5OSwiZXhwIjoyMDkxODczODk5fQ.y6ZtxZdsKbx4WxxWRbJ7CPXSe-0698ChXAsLc787xZg';

export const supabase = createClient(supabaseUrl, supabaseKey);
