import { createServer, type Socket } from "node:net";
import { once } from "node:events";

export async function testSmtp() {
  const messages: string[] = [];
  const sockets = new Set<Socket>();
  const control = { reject: false };
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.write("220 localhost ESMTP test\r\n");
    let pending = "",
      message = "",
      data = false;
    socket.on("data", (chunk) => {
      pending += chunk.toString();
      while (pending.includes("\r\n")) {
        const end = pending.indexOf("\r\n");
        const line = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (data) {
          if (line === ".") {
            data = false;
            messages.push(message);
            message = "";
            socket.write("250 accepted\r\n");
          } else message += line + "\n";
        } else if (line.startsWith("EHLO")) socket.write("250 localhost\r\n");
        else if (line.startsWith("RCPT") && control.reject)
          socket.write("550 Delivery rejected for test\r\n");
        else if (line === "DATA") {
          data = true;
          socket.write("354 send message\r\n");
        } else if (line === "QUIT") socket.end("221 bye\r\n");
        else socket.write("250 ok\r\n");
      }
    });
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  return {
    messages,
    control,
    port: (server.address() as { port: number }).port,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
