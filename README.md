# 🚨 FAA — Failure Alert Assistant

**Aviation-Themed Terminal Failure Detection for VS Code**

> Never miss a terminal failure again.

🚀 **2000+ installs within 24 hours of publishing on the VS Code Marketplace**

FAA monitors VS Code terminals in real-time and triggers **sound alerts + visual notifications** when errors, exceptions, or build failures are detected.

---

## ✨ Features

- 🔊 Automatic sound alerts on failure  
- 📢 Clean VS Code popup notifications  
- 🎯 30+ smart failure detection patterns  
- ⏱️ Configurable cooldown (default: 5 seconds)  
- 🖥️ Cross-platform (Windows, macOS, Linux)  
- ⚙️ Fully configurable settings  
- 🛫 Professional aviation-themed design  

---

## 📦 Installation

### From VS Code Marketplace
1. Open Extensions (`Ctrl + Shift + X`)
2. Search **FAA Failure Alert Assistant**
3. Click **Install**

### From VSIX
```bash
code --install-extension FAA-1.0.0.vsix
```

---

## ⚙️ Configuration

Search **“FAA”** in VS Code Settings.

| Setting | Default | Description |
|----------|----------|------------|
| `faa.enabled` | `true` | Enable/disable monitoring |
| `faa.cooldownSeconds` | `5` | Delay between alerts |
| `faa.showNotification` | `true` | Show popup alert |
| `faa.playSound` | `true` | Play alert sound |

Example:

```json
{
  "faa.enabled": true,
  "faa.cooldownSeconds": 5,
  "faa.showNotification": true,
  "faa.playSound": true
}
```

---

## 🎮 Commands

Access via Command Palette (`Ctrl + Shift + P`):

- **FAA: Test Alert** — Trigger a test notification  
- **FAA: Toggle Enabled** — Enable/Disable monitoring  

---

## 🏗 Architecture Overview

- Terminal Data Listener  
- Regex Pattern Detection Engine  
- Cooldown Manager  
- Cross-Platform Audio Handler  
- Notification Controller  

---

## 🔧 Troubleshooting

**Linux users:**
```bash
sudo apt install pulseaudio-utils
```

**macOS:** Uses built-in `afplay`  
**Windows:** Ensure system media components are enabled  

---

## 👨‍💻 Author

**Pradeep Kumar Awasthi**  
Instrumentation & Control Engineering  
Dr. B.R. Ambedkar NIT Jalandhar  

GitHub: https://github.com/pradeep-gif-hub  

---

## 📄 License

MIT License  

---

⭐ If FAA improves your workflow, consider starring the repository.

**FAA — Because failures shouldn’t go unnoticed.**
