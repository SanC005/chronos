const makeWAsocket = require("@adiwajshing/baileys").default;
//const job = require("./cron.js").job;
const {
  DisconnectReason,
  useMultiFileAuthState,
} = require("@adiwajshing/baileys");

const store = {};
const getMessage = (key) => {
  const { id } = key;
  if (store[id]) {
    return store[id].message;
  }
};

async function kronosBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const socket = makeWAsocket({
    version: [2, 2323, 4],
    printQRInTerminal: true,
    auth: state,
    getMessage,
  });
  const getText = (message) => {
    try {
      return message.conversation || message.extendedTextMessage.text;
    } catch {
      return "";
    }
  };
  const helpText = `Hi, I am Kronos! 😄 \nYou can use the following commands with prefix '!': \n 
1) echo - have kronos reply back  
2) help - to let kronos help you  
3) all - to tag everyone in group
4) welcome - to welcome the new joiners
More coming soon...`;
  const welcomeText = `Welcome to the group! 😄
Run !help to know more about kronos`;
  const sendMessage = async (jid, content, ...args) => {
    try {
      const sent = await socket.sendMessage(jid, content, ...args);
      store[sent.key.id] = sent;
    } catch (err) {
      console.error("\n send message faced error: ", err);
    }
  };
  const help = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    let command = "!help";
    if (!text.toLowerCase().startsWith(command)) {
      return;
    } else {
      sendMessage(key.remoteJid, { text: helpText });
    }
  };
  const welcome = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    let command = "!welcome";
    if (!text.toLowerCase().startsWith(command)) {
      return;
    } else {
      sendMessage(key.remoteJid, { text: welcomeText });
    }
  };
  const talk = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    let command = "!echo";
    //let regex = new RegExp(`^(?:!${command}|@${command}) (.+)`);
    if (!text.toLowerCase().startsWith(command)) {
      return;
    } else {
      const reply = text.slice(command.length + 1);
      sendMessage(key.remoteJid, { text: reply }, { quoted: msg });
    }
  };
  const schedule = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const command = "!schedule";
    if (!text.toLowerCase().startsWith(command)) {
      return;
    } else {
      const reply = "scheduled message";
      sendMessage(key.remoteJid, { text: reply }, { quoted: msg });
    }
  };
  const tagAll = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const command = "!all";
    if (!text.toLowerCase().includes(command)) {
      return;
    } else {
      const group = await socket.groupMetadata(key.remoteJid);
      const members = group.participants;
      const mentions = [];
      const items = [];
      members.forEach(({ id }) => {
        mentions.push(id);
        items.push(`@${id.slice(0, 12)}`);
      });
      sendMessage(
        key.remoteJid,
        { text: items.join(" "), mentions },
        { quoted: msg }
      );
    }
  };
  socket.ev.process(async (events) => {
    if (events["connection.update"]) {
      const { connection, lastDisconnect } = events["connection.update"];
      if (connection === "close") {
        if (
          lastDisconnect?.error?.output?.StatusCode !=
          DisconnectReason.loggedOut
        ) {
          kronosBot();
        } else {
          console.log("Disconnected becuase user has logged out");
        }
      }
    }
    if (events["creds.update"]) {
      await saveCreds();
    }
    if (events["messages.upsert"]) {
      const { messages } = events["messages.upsert"];
      messages.forEach((msg) => {
        if (!msg.message) return;
        //console.log(message);
        talk(msg);
        tagAll(msg);
        schedule(msg);
        help(msg);
        welcome(msg)
      });
    }
  });
}

kronosBot();
const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
console.log(Date.now() + " Ping Received");
response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
//job.start();
