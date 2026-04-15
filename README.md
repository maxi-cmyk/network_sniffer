# Network Sniffer

Real-time network packet sniffer with WebSocket streaming and live dashboard visualization to understand networks

## Tech Stack

- **Backend**: FastAPI + Scapy + asyncio + WebSocket
- **Frontend**: Next.js 14 + Tailwind CSS (Emerald theme)
- **Protocol**: WebSocket at `ws://localhost:8000/ws/traffic`

## Project Structure

```
network_sniffer/
├── README.md                   ← You are here
├── .gitignore
├── backend/
│   ├── requirements.txt
│   ├── venv/                  ← Python virtual environment (git-ignored)
│   └── app/
│       ├── main.py            ← FastAPI entry point
│       ├── core/
│       │   └── config.py     ← Configuration
│       ├── models/
│       │   └── packet.py    ← Packet data model
│       ├── services/
│       │   ├── sniffer.py    ← Sniffer service
│       │   └── pcap.py     ← PCAP save/load
│       ├── handlers/
│       │   └── packet.py    ← Packet processing
│       └── routes/
│           ├── health.py      ← /health endpoint
│           ├── pcap.py     ← /pcap endpoints
│           └── websocket.py  ← /ws/traffic
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── postcss.config.js
    ├── node_modules/           ← git-ignored
    └── src/
        ├── app/
        │   ├── page.tsx
        │   ├── layout.tsx
        │   └── globals.css     ← Emerald theme
        ├── features/telemetry/
        │   ├── components/
        │   │   └── Dashboard.tsx
        │   └── hooks/
        │       └── useTrafficStream.ts
        └── lib/
            └── utils.ts
```

## Features

- **Real-time packet capture** - Sniffs all IP/ARP traffic on your network
- **Live dashboard** - See packets as they arrive
- **Protocol filtering** - Filter by TCP, UDP, ICMP, ARP, IP
- **IP address filtering** - Filter by specific IP
- **Stats dashboard** - Total packets, data transferred, top protocol, unique IPs
- **Charts** - Protocol distribution bar chart, packet size line chart
- **Animated UI** - Smooth 60fps animations using GPU-accelerated CSS
- **PCAP export** - Save captured packets to .pcap file
- **PCAP import** - Load and replay .pcap files

## Prerequisites

- Python 3.9+
- Node.js 18+
- [Scapy](https://scapy.net/) for packet capture

### OS-Specific Requirements

| OS | Requirements |
|-----|--------------|
| **macOS** | Requires `sudo` to capture raw packets (scapy needs admin privileges) |
| **Linux** | Usually requires `sudo` or running as root |
| **Windows** | May need [Npcap](https://npcap.com/) installed for scapy packet capture |

## Setup

### Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server (sudo required on macOS/Linux for raw packet capture)
sudo uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be running at `http://localhost:8000`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be running at `http://localhost:3000`

## How It Works

### Architecture Overview

```
┌──────────────┐     WebSocket      ┌──────────────┐
│   Scapy    │ ──────────────► │  FastAPI   │ ───────► Browser
│   (sniff) │    /ws/traffic  │  (routes) │   (Dashboard)
│  (thread) │                └──────────────┘
└──────────────┘
```

### Backend Architecture (Modular/OOP)

```
app/
├── models/packet.py    ← Packet dataclass
├── services/sniffer.py  ← SnifferService manages sniffing + broadcast
├── services/pcap.py   ← PCAPService save/load operations
├── handlers/packet.py ← PacketHandler parses raw Scapy packets
└── routes/         ← API endpoints
```

### Backend Flow

1. **Packet Capture**: Scapy runs in background thread (`routes/websocket.py`)
2. **Packet Parsing**: `handlers/packet.py` processes raw packets → Packet objects (applies filters)
3. **Buffering**: `services/sniffer.py` buffers packets with thread locks
4. **Broadcast**: Every 50ms, buffered packets broadcast via WebSocket

### Frontend Flow

1. **WebSocket Connection**: Connects to `ws://localhost:8000/ws/traffic`
2. **Batched Updates**: State updates every 100ms
3. **Visualization**: Stats, charts, packet list with filters

### Performance Optimizations

- **Batched WebSocket updates**: Prevents React re-render thrashing
- **Transform/Opacity animations**: Uses only GPU-accelerated CSS properties for 60fps animations
- **Monochrome design**: Single accent color (#69f6b8 Emerald) for clean, terminal-like aesthetic

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `s` | Start/Stop capturing |
| `c` | Clear packets |
| `f` | Focus IP filter input |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /pcap/save` | Save captured packets to .pcap file |
| `POST /pcap/load` | Load .pcap file and replay to clients |
| `WS /ws/traffic` | WebSocket endpoint for real-time packet stream |

## PCAP Usage

### What is PCAP?

PCAP (Packet CAPture) is a binary file format for storing network traffic. Use Wireshark to analyze saved captures.

### Save Captured Packets

1. Click **Save PCAP** in the dashboard
2. A `.pcap` file is saved to the backend directory
3. Open in Wireshark: `wireshark capture_*.pcap`

### Load and Replay PCAP

1. Click **Load PCAP** in the dashboard
2. Select a `.pcap` file
3. Packets are replayed through the dashboard

### CLI Examples

```bash
# Capture packets with tcpdump
sudo tcpdump -w capture.pcap

# View with tcpdump
tcpdump -r capture.pcap

# Convert to JSON with tshark
tshark -r capture.pcap -T json > capture.json
```

## WebSocket Message Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000000",
  "src": "192.168.1.100",
  "src_port": 52341,
  "dst": "142.250.185.78",
  "dst_port": 443,
  "proto": "TCP",
  "length": 64,
  "info": "52341 -> 443"
}
```

## Permissions Note

On macOS and Linux, you'll need to run the backend with elevated privileges to capture network packets:

```bash
sudo uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Alternatively, you can grant raw socket access to your user (OS-specific).

## Learning Resources

This project comes with learning materials:

- **LEARNING_ROADMAP.md** - A structured path from beginner to competent network engineer
- **docs/networking-basics.md** - Beginner-friendly explanations of networking concepts

### Suggested Learning Order

1. **Week 1-2**: Read docs/networking-basics.md to understand basics
2. **Week 3-4**: Use the protocol filter while observing traffic
3. **Week 5-8**: Analyze PCAP files, learn Wireshark
4. **Week 9-12**: CTF challenges (PicoCTF Network category)

## Troubleshooting

- **No packets showing**: Ensure you're running the backend with `sudo`
- **WebSocket connection failed**: Verify the backend is running on port 8000
- **Frontend build errors**: Run `npm install` from the `frontend/` directory
- **`@types/react` errors in editor**: Make sure `npm install` has been run in `frontend/`

## Contributing

This is a learning project. Feel free to:
- Add new features
- Improve documentation
- Fix bugs
- Share what you learn!