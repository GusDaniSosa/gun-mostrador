#!/bin/bash
echo "Limpiando puertos..."
fuser -k 5000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

echo "Iniciando backend (Flask)..."
source venv/bin/activate
nohup python3 run.py > backend.log 2>&1 &

echo "Iniciando frontend (React)..."
cd pantalla
nohup npm run dev -- --host > frontend.log 2>&1 &

echo "¡Entorno GUN activo y corriendo en segundo plano!"
