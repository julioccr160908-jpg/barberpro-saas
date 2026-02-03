
const { spawn } = require('child_process');
const fs = require('fs');

const sql = fs.readFileSync('add_loyalty_schema.sql', 'utf8');

const child = spawn('docker', ['exec', '-i', 'supabase_db_barberpro-saas', 'psql', '-U', 'postgres', '-d', 'postgres'], {
    stdio: ['pipe', 'inherit', 'inherit']
});

child.stdin.write(sql);
child.stdin.end();

child.on('close', (code) => {
    console.log(`Docker psql exited with code ${code}`);
});
