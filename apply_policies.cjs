
const { exec } = require('child_process');
const fs = require('fs');

const sql = fs.readFileSync('fix_org_policies.sql', 'utf8');

// Escape double quotes for shell if necessary, but simpler to pipe via stdin logic if we could.
// Since passing as arg is fragile for long multiline SQL with quotes,
// let's try to spawn the process and write to stdin.

const { spawn } = require('child_process');

const child = spawn('npx', ['supabase', 'db', 'execute'], {
    shell: true,
    stdio: ['pipe', 'inherit', 'inherit']
});

child.stdin.write(sql);
child.stdin.end();

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
});
