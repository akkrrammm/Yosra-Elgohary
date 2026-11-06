// Creates a dashboard administrator. Run this yourself, in your own terminal:
//
//   npm run cms:create-admin              The website's owner
//   npm run cms:create-admin -- --editor  Someone who can edit content, but not manage administrators
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
// The password is typed here, hidden, and is never written to a file or shown.
import { createInterface } from "node:readline/promises";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, requireEnv, secretKey, supabaseUrl } from "./lib/env.mjs";

const MIN_PASSWORD_LENGTH = 10;

loadEnv();
requireEnv([
  [supabaseUrl(), "NEXT_PUBLIC_SUPABASE_URL"],
  [secretKey(), "SUPABASE_SECRET_KEY"],
]);

const supabase = createClient(supabaseUrl(), secretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { stdin, stdout } = process;

/** Piped input arrives as one stream, so it is read once and handed out line by line. */
const pipedLines = stdin.isTTY ? null : (await readAll(stdin)).split(/\r?\n/);

async function readAll(stream) {
  let text = "";
  for await (const chunk of stream) text += chunk;
  return text;
}

async function ask(question) {
  if (pipedLines) {
    stdout.write(question + "\n");
    return (pipedLines.shift() ?? "").trim();
  }
  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question(question);
  prompt.close();
  return answer.trim();
}

function askHidden(question) {
  if (pipedLines) {
    stdout.write(question + "\n");
    return Promise.resolve(pipedLines.shift() ?? "");
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

async function findUser(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
}

async function main() {
  const email = (await ask("Email: ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That does not look like an email address.");

  const displayName = await ask("Name shown in the dashboard (optional): ");

  let user = await findUser(email);

  if (user) {
    const answer = await ask("An account with this email already exists. Make it an administrator? It keeps its current password. (yes/no): ");
    if (answer.toLowerCase() !== "yes") {
      console.log("Nothing was changed.");
      return;
    }
  } else {
    const password = await askHidden(`Password, at least ${MIN_PASSWORD_LENGTH} characters (hidden): `);
    if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    const repeat = await askHidden("Repeat the password (hidden): ");
    if (password !== repeat) throw new Error("The two passwords do not match.");

    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(error.message);
    user = data.user;
  }

  const { error } = await supabase.from("admin_users").upsert({
    user_id: user.id,
    role: process.argv.includes("--editor") ? "editor" : "owner",
    display_name: displayName || null,
  });
  if (error) {
    throw new Error(error.code === "PGRST205" || error.code === "42P01" ? "The CMS tables are not there yet. Run npm run cms:migrate first." : error.message);
  }

  console.log(`\nDone. ${email} can now sign in at /admin.`);
}

main().catch((error) => {
  console.error(`\nStopped: ${error.message}`);
  process.exitCode = 1;
});
