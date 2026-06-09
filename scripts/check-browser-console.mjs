const devtoolsUrl = process.env.DEVTOOLS_URL ?? "http://127.0.0.1:9223";
const appUrl = process.env.APP_URL ?? "http://127.0.0.1:3200";

const pages = await (await fetch(`${devtoolsUrl}/json`)).json();
const page = pages.find((candidate) => candidate.type === "page");
if (!page) throw new Error("Không tìm thấy browser page để kiểm tra");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));

let id = 0;
const pending = new Map();
const issues = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }

  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    issues.push(JSON.stringify(message.params));
  }
  if (message.method === "Runtime.exceptionThrown") {
    issues.push(JSON.stringify(message.params));
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    issues.push(JSON.stringify(message.params));
  }
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const requestId = ++id;
    const timeout = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`CDP timeout: ${method}`));
    }, 5000);
    pending.set(requestId, (message) => {
      clearTimeout(timeout);
      resolve(message);
    });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `
    new MutationObserver((_, observer) => {
      if (document.documentElement && document.body) {
        document.documentElement.setAttribute("data-extension-injected", "true");
        document.body.setAttribute("data-extension-body", "true");
        observer.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  `,
});
await send("Page.navigate", { url: `${appUrl}/` });
await sleep(3500);
await send("Runtime.evaluate", {
  expression: `localStorage.setItem("lua-san-26:favorites", '["match-1"]'); location.href = "/lich-dau";`,
});
await sleep(3500);
await send("Page.navigate", { url: `${appUrl}/yeu-thich` });
await sleep(3500);

socket.close();

const hydrationIssues = issues.filter((issue) =>
  /hydrat|server rendered html|didn't match|mismatch/i.test(issue),
);

if (hydrationIssues.length) {
  console.error(hydrationIssues.join("\n---\n"));
  process.exit(1);
} else {
  console.log(`Browser console sạch: không có hydration mismatch trên 3 lượt tải.`);
  process.exit(0);
}
