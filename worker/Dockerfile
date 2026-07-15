FROM python:3.12-slim AS base
WORKDIR /app

RUN groupadd -r worker && useradd -r -g worker worker

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py ./

USER worker

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import redis, os; redis.Redis(host=os.getenv('REDIS_HOST','redis'), port=int(os.getenv('REDIS_PORT',6379))).ping()" || exit 1

CMD ["python", "worker.py"]
