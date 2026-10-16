import http from 'node:http';
import { createMailer } from './mailer.js';
import { createServer, parseDuration } from './server.js';
import { FileStore } from './store.js';

const listen = process.env.LISTEN || ':8787';
const data = process.env.WATCH_DATA || 'accountability.json';
const staleMs = parseDuration(process.env.STALE_AFTER, 4 * 60 * 60 * 1000);
const token = process.env.WATCH_TOKEN || '';

const store = FileStore.open(data);
const mail = createMailer();
if (!mail.ready) {
  console.log('SMTP não configurado — e-mails só serão registrados no log');
}

const { handler, sweep } = createServer({ store, mail, token, staleMs });
setInterval(() => {
  void sweep();
}, 10 * 60 * 1000);

const hostPort = listen.startsWith(':') ? { port: Number(listen.slice(1)) } : (() => {
  const [host, port] = listen.split(':');
  return { host, port: Number(port) };
})();

http.createServer(handler).listen(hostPort.port, hostPort.host, () => {
  console.log(`staypure-watch em ${listen} (silêncio após ${staleMs}ms)`);
});
