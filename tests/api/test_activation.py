import requests
import json
import time

BASE_URL = "https://mundonatela.lovable.app"
INSTALL_ID = f"test-device-{int(time.time())}"

def test_flow():
    print(f"--- Iniciando teste para {INSTALL_ID} ---")
    
    # 1. Registrar dispositivo
    print("\n1. Registrando dispositivo...")
    res = requests.post(f"{BASE_URL}/api/public/device/register", json={"installation_id": INSTALL_ID, "model": "Test Model", "version": "1.0"})
    print(f"Status: {res.status_code}, Response: {res.json()}")
    
    # 2. Solicitar código
    print("\n2. Solicitando código de ativação...")
    res = requests.post(f"{BASE_URL}/api/public/device/request-code", json={"installation_id": INSTALL_ID})
    data = res.json()
    print(f"Status: {res.status_code}, Response: {data}")
    
    request_id = data.get("request_id")
    poll_token = data.get("poll_token")
    code = data.get("code")

    # 3. Confirmar pendente via polling
    print("\n3. Verificando status pendente via polling...")
    res = requests.post(f"{BASE_URL}/api/public/device/poll", json={"request_id": request_id, "poll_token": poll_token})
    print(f"Status: {res.status_code}, Response: {res.json()}")

    # 4. Confirmar que check sem token/pendente não entrega dados sensíveis
    print("\n4. Verificando check para dispositivo pendente (sem token)...")
    res = requests.post(f"{BASE_URL}/api/public/device/check", json={"installation_id": INSTALL_ID})
    print(f"Status: {res.status_code}, Response: {res.json()}")

    print("\n--- Fim dos testes automáticos (parte pública) ---")
    print("Nota: A aprovação e o bloqueio exigem intervenção no painel adm ou via supabaseAdmin.")

if __name__ == "__main__":
    test_flow()
