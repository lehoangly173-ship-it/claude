import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Khóa "publishable" là khóa công khai, được phép nằm trong app (quyền được giới hạn bằng RLS).
const URL = 'https://zpplbnzyizrxyhrlergt.supabase.co';
const KEY = 'sb_publishable_NV8SVb2p93E1keWdMgxkaQ_5qw4qYsn';

export const supabase = createClient(URL, KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
