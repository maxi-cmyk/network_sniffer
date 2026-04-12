import asyncio
import websockets

async def test():
    async with websockets.connect("ws://localhost:8000/ws/traffic") as ws:
        print("Connected!")
        for _ in range(5):
            msg = await ws.recv()
            print("Received:", msg)

asyncio.run(test())
