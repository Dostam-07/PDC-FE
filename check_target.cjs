const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:/Users/User4/.gemini/antigravity/brain/797fb688-8397-466d-b7bb-a4dd5d8077b4/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let targetFound = null;
  for await (const line of rl) {
    if (line.includes('"edit_file"') && line.includes('LFATableGrid.tsx')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls && obj.tool_calls[0].args && obj.tool_calls[0].args.Target) {
          targetFound = obj.tool_calls[0].args.Target;
        }
      } catch (e) {}
    }
  }

  if (targetFound) {
    fs.writeFileSync('C:/Users/User4/Downloads/PDC-FE/prev_target.txt', targetFound);
    console.log('Saved prev_target.txt, length:', targetFound.length);
  } else {
    console.log('Not found');
  }
}
run();
