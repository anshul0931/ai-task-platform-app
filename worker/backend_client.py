import os
import requests

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend:5000/api")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "change_this_internal_key")

HEADERS = {
    "Content-Type": "application/json",
    "x-internal-api-key": INTERNAL_API_KEY,
}


def update_task_status(task_id: str, payload: dict, timeout: int = 10):
    """Push a status/result update back to the Node backend via its internal API."""
    url = f"{BACKEND_API_URL}/tasks/{task_id}/status"
    response = requests.patch(url, json=payload, headers=HEADERS, timeout=timeout)
    response.raise_for_status()
    return response.json()
