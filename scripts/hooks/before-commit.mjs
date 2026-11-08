// PreToolUse hook on Bash: before git commit/push, run the secret scan.
import { execSync } from 'node:child_process';
let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = JSON.parse(input).tool_input?.command || ''; } catch {}
  if (!/\bgit\s+(commit|push)\b/.test(cmd)) process.exit(0);
  try {
    execSync('node scripts/check-secrets.mjs', { stdio: 'pipe' });
    process.exit(0);
  } catch (e) {
    process.stderr.write(String(e.stdout || e.stderr || e.message));
    process.exit(2);
  }
});
