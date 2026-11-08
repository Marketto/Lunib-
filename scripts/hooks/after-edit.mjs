// PostToolUse hook: if a content file was edited, validate the content and remind about verification.
import { execSync } from 'node:child_process';
let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let file = '';
  try { file = JSON.parse(input).tool_input?.file_path || ''; } catch {}
  if (!/[\\/]content[\\/]/.test(file)) process.exit(0);
  try {
    execSync('npm run -s content', { stdio: 'pipe' });
  } catch (e) {
    process.stderr.write(`Validazione contenuti fallita:\n${String(e.stdout || e.message).slice(-1500)}`);
    process.exit(2);
  }
  process.stderr.write('Contenuti validi. Ricorda: dopo ogni trasformazione dei dati di ricerca esegui la skill verify-content (evidence-verifier).');
  process.exit(0);
});
