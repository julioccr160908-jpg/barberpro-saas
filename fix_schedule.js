
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

const FULL_SCHEDULE = [
    { dayId: 0, isOpen: false, openTime: "09:00", closeTime: "18:00" }, // Dom
    { dayId: 1, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Seg
    { dayId: 2, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Ter
    { dayId: 3, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Qua
    { dayId: 4, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Qui
    { dayId: 5, isOpen: true, openTime: "09:00", closeTime: "19:00", breakStart: "12:00", breakEnd: "13:00" }, // Sex
    { dayId: 6, isOpen: true, openTime: "09:00", closeTime: "17:00" }, // Sab
];

async function main() {
    const { error } = await supabase.from('settings').update({
        schedule: FULL_SCHEDULE
    }).eq('id', 1);

    if (error) {
        console.error('Error fixing schedule:', error);
    } else {
        console.log('Schedule restored successfully!');
    }
}

main();
