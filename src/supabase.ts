import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Khóa "publishable" là khóa công khai, được phép nằm trong app (quyền được giới hạn bằng RLS).
const URL = 'https://llqhqpccqvbyckkkwumm.supabase.co';
const KEY = 'sb_publishable_syhvUjaVo6bgFfqmZyC51Q_S4eJGBnr';

export const supabase = createClient(URL, KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
