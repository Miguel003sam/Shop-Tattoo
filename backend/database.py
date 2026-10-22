
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cargar las variables del archivo .env
load_dotenv()

# Obtener la dirección de conexión
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("No se encontró DATABASE_URL en el archivo .env")

# Crear la conexión con PostgreSQL
engine = create_engine(DATABASE_URL)

# Crear las sesiones para trabajar con la base de datos
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base para nuestros modelos
Base = declarative_base()

# Obtener una sesión y cerrarla al finalizar
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
