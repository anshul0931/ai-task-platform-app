import os
import json
import logging
import signal
import sys
import time
from datetime import datetime, timezone

from dotenv import load_dotenv

from redis_client import get_redis_client
from backend_client import update_task_status
from processor import process_task

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [worker] %(levelname)s %(message)s",
)
logger = logging.getLogger("worker")

QUEUE_NAME = os.getenv("QUEUE_NAME", "ai-tasks")
BRPOP_TIMEOUT_SECONDS = 5

running = True


def _handle_shutdown(signum, frame):
    global running
    logger.info("Shutdown signal received, finishing current job then exiting...")
    running = False


signal.signal(signal.SIGTERM, _handle_shutdown)
signal.signal(signal.SIGINT, _handle_shutdown)


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def handle_job(redis_client, raw_job: str):
    job = json.loads(raw_job)
    task_id = job["taskId"]
    operation = job["operation"]
    input_text = job.get("inputText", "")
    attempts = job.get("attempts", 0)
    max_attempts = job.get("maxAttempts", 3)

    logger.info(f"Picked up task {task_id} (operation={operation}, attempt={attempts + 1})")

    try:
        # Step: Pending -> Running
        update_task_status(
            task_id,
            {
                "status": "running",
                "startedAt": _now_iso(),
                "logMessage": f"Worker started processing operation '{operation}'",
            },
        )

        result = process_task(operation, input_text)

        # Step: Running -> Success
        update_task_status(
            task_id,
            {
                "status": "success",
                "result": result,
                "completedAt": _now_iso(),
                "logMessage": "Task completed successfully",
            },
        )
        logger.info(f"Task {task_id} completed successfully")

    except Exception as exc:
        logger.error(f"Task {task_id} failed: {exc}")
        attempts += 1

        if attempts < max_attempts:
            job["attempts"] = attempts
            redis_client.lpush(QUEUE_NAME, json.dumps(job))
            try:
                update_task_status(
                    task_id,
                    {"logMessage": f"Attempt {attempts} failed: {exc}. Re-queued for retry."},
                )
            except Exception:
                pass
            logger.info(f"Task {task_id} re-queued (attempt {attempts}/{max_attempts})")
        else:
            try:
                update_task_status(
                    task_id,
                    {
                        "status": "failed",
                        "error": str(exc),
                        "completedAt": _now_iso(),
                        "logMessage": f"Task failed after {max_attempts} attempts: {exc}",
                    },
                )
            except Exception as inner_exc:
                logger.error(f"Failed to report failure for task {task_id}: {inner_exc}")


def main():
    redis_client = get_redis_client()
    logger.info(f"Worker started, listening on queue '{QUEUE_NAME}'")

    while running:
        try:
            item = redis_client.brpop(QUEUE_NAME, timeout=BRPOP_TIMEOUT_SECONDS)
            if item is None:
                continue  # timeout, loop again so we can check `running`
            _, raw_job = item
            handle_job(redis_client, raw_job)
        except Exception as exc:
            logger.error(f"Worker loop error: {exc}")
            time.sleep(2)

    logger.info("Worker stopped cleanly")
    sys.exit(0)


if __name__ == "__main__":
    main()
