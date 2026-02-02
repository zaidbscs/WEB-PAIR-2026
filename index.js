const express = require("express");
const bodyParser = require("body-parser");
const P = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

let sock;

async function startBot(phone) {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    browser: ["WEB-PAIR", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(phone);
    return code;
  }

  return "Already paired";
}

// API to request pair code
app.post("/pair", async (req, res) => {
  try {
    let phone = req.body.phone;

    if (!phone) {
      return res.json({ status: false, message: "Phone number required" });
    }

    // remove + and spaces
    phone = phone.replace(/[^0-9]/g, "");

    // Pakistan example check
    if (phone.startsWith("0")) {
      return res.json({
        status: false,
        message: "Use country code. Example: 923001234567"
      });
    }

    const code = await startBot(phone);
    res.json({ status: true, code });

  } catch (err) {
    res.json({ status: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ WEB-PAIR running on http://localhost:3000");
});
