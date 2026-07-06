FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --fix-missing \
    gcc \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir --retries 5 --timeout 60 -r requirements-dev.txt && pip install --no-cache-dir --retries 5 --timeout 60 -r requirements.txt

# Copy source
COPY . .

# Create artifacts dir
RUN mkdir -p /app/app/ml/artifacts

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
