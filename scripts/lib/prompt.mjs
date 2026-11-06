import { createInterface } from "node:readline/promises";

/**
 * Questions in the terminal. A hidden answer is never shown or stored.
 * Piped input arrives as one stream, so it is read once and handed out line by line.
 */

const { stdin, stdout } = process;

let pipedLines = null;

async function nextPipedLine() {
  if (pipedLines === null) {
    let text = "";
    for await (const chunk of stdin) text += chunk;
    pipedLines = text.split(/\r?\n/);
  }
  return pipedLines.shift() ?? "";
}

export async function ask(question) {
  if (!stdin.isTTY) {
    stdout.write(`${question}\n`);
    return (await nextPipedLine()).trim();
  }
  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question(question);
  prompt.close();
  return answer.trim();
}

export function askHidden(question) {
  if (!stdin.isTTY) {
    stdout.write(`${question}\n`);
    return nextPipedLine();
  }
  return new Promise((resolve) => {
    let value = "";
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish();
          process.exit(130);
        }
        if (character === "\r" || character === "\n" || character === "\u0004") {
          finish();
          resolve(value);
          return;
        }
        if (character === "\u0008" || character === "\u007f") value = value.slice(0, -1);
        else value += character;
      }
    };

    stdin.on("data", onData);
  });
}
