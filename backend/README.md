# TOEFL Speaking Master - Backend

FastAPI backend for TOEFL iBT Speaking Task 3 practice application.

## Setup

### Prerequisites

- Python 3.12+ (via Anaconda)
- Azure Database for MySQL (Flexible Server)
- Anaconda environment `rislingo`

### Installation

**⚠️ IMPORTANT: Always use the `rislingo` Anaconda environment**

```bash
# Activate the rislingo environment
conda activate rislingo

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your Azure OpenAI configuration
```

### Database Setup

#### Azure Database for MySQL Configuration

1. Create an Azure Database for MySQL Flexible Server in Azure Portal
2. Configure firewall rules to allow your IP address
3. Create a database named `toefl_speaking_db`
4. Update `.env` file with your Azure MySQL credentials:

```bash
# Copy the example configuration
cp .env.azure.example .env

# Edit .env and update with your Azure MySQL credentials:
# - MYSQL_HOST: Your Azure MySQL server hostname (e.g., myserver.mysql.database.azure.com)
# - MYSQL_PORT: 3306 (default)
# - MYSQL_DATABASE: toefl_speaking_db
# - MYSQL_USERNAME: Your admin username (e.g., adminuser@myserver)
# - MYSQL_PASSWORD: Your secure password
# - MYSQL_SSL_MODE: REQUIRED (for Azure)
```

#### Test Database Connection

```bash
# Test the MySQL connection
python test_mysql_connection.py
```

#### Initialize Database Tables

```bash
# Option 1: Using the initialization script (recommended for first setup)
python init_mysql_database.py

# Option 2: Using Alembic migrations
alembic upgrade head
```

### Running the Application

**⚠️ IMPORTANT: Run in the `rislingo` environment**

```bash
# Activate environment
conda activate rislingo

# Start the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

API documentation: http://localhost:8000/docs

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── models.py             # SQLAlchemy models
├── database.py           # Database configuration
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables
```

## Environment Variables

### MySQL Database Configuration
- `MYSQL_HOST`: Azure MySQL server hostname (e.g., myserver.mysql.database.azure.com)
- `MYSQL_PORT`: MySQL port (default: 3306)
- `MYSQL_DATABASE`: Database name (e.g., toefl_speaking_db)
- `MYSQL_USERNAME`: MySQL username (e.g., adminuser@myserver)
- `MYSQL_PASSWORD`: MySQL password
- `MYSQL_SSL_MODE`: SSL mode (REQUIRED for Azure)
- `DATABASE_URL`: Complete MySQL connection string (auto-generated from above variables)

### Azure OpenAI Configuration
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI endpoint URL
- `AZURE_OPENAI_API_VERSION`: Azure OpenAI API version
- `AZURE_OPENAI_GPT4_DEPLOYMENT`: GPT-4 deployment name
- `AZURE_OPENAI_WHISPER_DEPLOYMENT`: Whisper deployment name
- `AZURE_OPENAI_TTS_DEPLOYMENT`: TTS deployment name

### Optional Configuration
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)
- `RATE_LIMIT_PER_MINUTE`: Rate limit per user per minute
- `PORT`: Server port (default: 8000)

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=.
```
