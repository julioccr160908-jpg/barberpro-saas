
import { createClient } from '@supabase/supabase-js';
// dotenv removed

// Load env vars if you were using them, but for now we hardcode for the local test as seen in other files
// or use the values we know.
// Local Supabase URL and Anon Key (standard defaults)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvYWRndnd5dnhmd3Z4ZnZ4ZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYyNzQ0ODIsImV4cCI6MTkyMzg1MDQ4Mn0.L_hC_jFj_jFj_jFj_jFj_jFj_jFj_jFj_jFj_jFj_jF';

// We need a real user to test "Authenticated Upload" policy
const TEST_EMAIL = 'dono1@gmail.com';
const TEST_PASSWORD = '123456';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
    console.log('🧪 Starting Storage Upload Test...');

    // 1. Sign In
    console.log(`🔑 Logging in as ${TEST_EMAIL}...`);
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
    });

    if (loginError) {
        console.error('❌ Login failed:', loginError.message);
        return;
    }
    console.log('✅ Login successful.');

    // 2. Prepare Test File
    const fileName = `test-upload-${Date.now()}.txt`;
    const fileContent = 'This is a test file to verify Supabase Storage uploads.';
    // Convert to Blob/File not strictly needed for Node client usually, looks for Buffer/String
    // But supabase-js in node env handles Buffer.

    // 3. Upload
    console.log(`📤 Uploading ${fileName} to 'organization-assets'...`);
    const { data, error: uploadError } = await supabase
        .storage
        .from('organization-assets')
        .upload(fileName, fileContent, {
            contentType: 'text/plain',
            upsert: true
        });

    if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        console.error('   Hint: Ensure "organization-assets" bucket exists and RLS allows INSERT for authenticated users.');
        return;
    }
    console.log('✅ Upload successful:', data);

    // 4. Verify Public Access
    const { data: { publicUrl } } = supabase
        .storage
        .from('organization-assets')
        .getPublicUrl(fileName);

    console.log(`🌍 Checking public URL: ${publicUrl}`);

    // Fetch the URL to see if it's 200 OK
    try {
        const response = await fetch(publicUrl);
        if (response.ok) {
            const text = await response.text();
            if (text === fileContent) {
                console.log('✅ Public access verified! Content matches.');
            } else {
                console.warn('⚠️ Public access verified, but content differs?');
            }
        } else {
            console.error(`❌ Public access failed with status: ${response.status}`);
        }
    } catch (fetchError) {
        console.error('❌ Network error verifying public URL:', fetchError);
    }

    // 5. Cleanup (Optional, test delete policy)
    console.log('🧹 Cleaning up...');
    const { error: deleteError } = await supabase
        .storage
        .from('organization-assets')
        .remove([fileName]);

    if (deleteError) {
        console.warn('⚠️ Cleanup (Delete) failed:', deleteError.message);
    } else {
        console.log('✅ Cleanup successful.');
    }

    console.log('🎉 Test Completed Successfully!');
}

runTest();
